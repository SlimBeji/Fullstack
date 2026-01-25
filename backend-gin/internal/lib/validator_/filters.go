package validator_

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/utils"
	"fmt"
	"reflect"
	"slices"
	"strconv"
	"strings"
	"time"
)

func BuildFindQuery(
	filters any, findQuery *types_.FindQuery, maxItems int,
) map[string][]string {
	result := make(map[string][]string)
	values := reflect.ValueOf(filters)
	types := reflect.TypeOf(filters)

	for i := 0; i < types.NumField(); i++ {
		value := values.Field(i)
		type_ := types.Field(i)
		validateTag := type_.Tag.Get("validate")
		filterTag := type_.Tag.Get("filter")

		if !value.IsValid() {
			return map[string][]string{"general": {"something went wrong while parsing http filters!"}}
		}

		switch type_.Name {
		case "Page":
			if value.Kind() != reflect.Int {
				result["page"] = []string{"Page value must be a positive integer"}
			}
			val := int(value.Int())
			if val < 0 {
				result["page"] = []string{"Page value must be a positive integer"}
			} else if val == 0 {
				// zero value, probably was not set
				val = 1
			}
			findQuery.Page = val
		case "Size":
			if value.Kind() != reflect.Int {
				result["size"] = []string{fmt.Sprintf("Size value must be an integer between 1 and %d", maxItems)}
			}
			val := int(value.Int())
			if val == 0 {
				// zero value, probably was not set
				val = maxItems
			}
			if val < 0 || val > maxItems {
				result["size"] = []string{fmt.Sprintf("Size value must be an integer between 1 and %d", maxItems)}
			}
			findQuery.Size = val
		case "Sort":
			val, msg := validateLists(value, validateTag)
			if msg != "" {
				result["sort"] = []string{msg}
			}
			findQuery.Sort = val
		case "Fields":
			val, msg := validateLists(value, validateTag)
			if msg != "" {
				result["fields"] = []string{msg}
			}
			findQuery.Fields = val
		default:
			val, msgs := validateFilters(type_.Name, value, filterTag)
			if len(msgs) > 0 {
				result[type_.Name] = msgs
			}
			if findQuery.Filters == nil {
				findQuery.Filters = make(types_.FindQueryFilters)
			}
			if len(val) > 0 {
				findQuery.Filters[type_.Tag.Get("json")] = val
			}
		}
	}

	return result
}

func validateLists(v reflect.Value, tag string) ([]string, string) {
	val, ok := v.Interface().([]string)
	if !ok {
		return val, "Fields value must be a list of strings"
	}
	msg := ValidateVar(val, tag)
	return val, msg
}

type filterValidationParams struct {
	fieldName     string
	isIndexed     bool
	validationTag string
	typeStr       string
}

func validateFilters(
	name string, v reflect.Value, tag string,
) ([]types_.Filter, []string) {
	var strErrors []string
	var filters []types_.Filter
	var params filterValidationParams
	params.fieldName = name

	strFilters, ok := v.Interface().([]string)
	if !ok {
		msg := fmt.Sprintf("param %s filters must be a list of strings", name)
		return filters, []string{msg}
	}

	// Returns nothing if no strFilters
	if len(strFilters) == 0 {
		return filters, strErrors
	}

	// Parse the tags
	tagParts := strings.Split(tag, ",")
	params.typeStr = tagParts[0]
	if params.typeStr == "" {
		params.typeStr = "string"
	}
	tagParts = tagParts[1:]
	tagParts, params.isIndexed = utils.RemoveFromList(tagParts, "indexed")
	params.validationTag = strings.Join(tagParts, ",")

	// Iterate over each str filter and convert it to Filter with validation
	var usedFilters []types_.FilterOp
	for _, strFilter := range strFilters {
		filter, fieldErrors := validateFilter(strFilter, params)

		if slices.Contains(usedFilters, filter.Op) {
			fieldErrors = append(
				fieldErrors,
				fmt.Sprintf("cannot use an operator twice for the same field. %s used multiple times", filter.Op),
			)
		} else {
			usedFilters = append(usedFilters, filter.Op)
		}

		if slices.Contains(usedFilters, types_.FilterEq) && len(usedFilters) >= 2 {
			fieldErrors = append(
				fieldErrors,
				fmt.Sprintf("eq can only be used exclusively. %s used at the same time", usedFilters),
			)
		}

		if len(fieldErrors) > 0 {
			strErrors = append(strErrors, fieldErrors...)
		} else {
			filters = append(filters, filter)
		}
	}

	return filters, strErrors
}

func validateFilter(
	strFilter string, params filterValidationParams,
) (types_.Filter, []string) {
	var filter types_.Filter
	op := types_.FilterOp("eq")
	rawVal := ""

	parts := strings.SplitN(strFilter, ":", 2)
	if len(parts) == 1 {
		rawVal = parts[0]
	} else if len(parts) == 2 {
		op = types_.FilterOp(parts[0])
		rawVal = parts[1]
	}

	switch params.typeStr {
	case "string":
		return validateStringFilter(rawVal, op, params)
	case "int", "types_.FlexInt":
		return validateIntFilter(rawVal, op, params)
	case "float64", "types_.FlexFloat":
		return validateFloat64Filter(rawVal, op, params)
	case "bool", "types_.FlexBool":
		return validateBoolFilter(rawVal, op, params)
	case "time.Time":
		return validateTimeFilter(rawVal, op, params)
	default:
		msg := fmt.Sprintf("Unknown type %s for field %s", params.typeStr, params.fieldName)
		return filter, []string{msg}
	}
}

func validateStringFilter(
	rawVal string, op types_.FilterOp, params filterValidationParams,
) (types_.Filter, []string) {
	var filter types_.Filter
	var vals []string
	var msgs []string
	filter.Op = op

	switch op {
	case types_.FilterEq, types_.FilterNe:
		filter.Val = rawVal
		vals = []string{rawVal}
	case types_.FilterIn, types_.FilterNin:
		parts := strings.Split(rawVal, ",")
		filter.Val = parts
		vals = parts
	case types_.FilterRegex:
		filter.Val = rawVal
		return filter, msgs
	case types_.FilterText:
		filter.Val = rawVal
		if !params.isIndexed {
			return filter, []string{fmt.Sprintf("you cannot use text filter for field %s", params.fieldName)}
		}
		return filter, msgs
	case types_.FilterExists:
		filter.Val = utils.StrToBool(rawVal)
		return filter, msgs
	default:
		msg := fmt.Sprintf("wrong filter operation for %s param. %s is not among eq, ne, regex, text, in, nin, exists", params.fieldName, op)
		return filter, []string{msg}
	}

	// Validate the vals here
	for _, val := range vals {
		msg := ValidateVar(val, params.validationTag)
		if msg != "" {
			msgs = append(msgs, msg)
		}
	}
	return filter, msgs
}

func validateIntFilter(
	rawVal string, op types_.FilterOp, params filterValidationParams,
) (types_.Filter, []string) {
	var filter types_.Filter
	var vals []int
	var msgs []string
	filter.Op = op

	switch op {
	case types_.FilterEq, types_.FilterNe, types_.FilterGt, types_.FilterGte, types_.FilterLt, types_.FilterLte:
		val, err := strconv.Atoi(rawVal)
		if err != nil {
			msg := fmt.Sprintf("%s is not a valid integer", rawVal)
			return filter, []string{msg}
		}
		vals = append(vals, val)
		filter.Val = val
	case types_.FilterIn, types_.FilterNin:
		parts := strings.Split(rawVal, ",")
		for _, i := range parts {
			val, err := strconv.Atoi(i)
			if err != nil {
				msgs = append(msgs, fmt.Sprintf("%s is not a valid integer", i))
			} else {
				vals = append(vals, val)
			}
		}
		if len(msgs) > 0 {
			return filter, msgs
		}
		filter.Val = vals
	case types_.FilterExists:
		filter.Val = utils.StrToBool(rawVal)
		return filter, msgs
	default:
		msg := fmt.Sprintf("wrong filter operation for %s param. %s is not among eq, ne, gt, gte, lt, lte, in, nin, exists", params.fieldName, op)
		return filter, []string{msg}
	}

	// Validate the vals here
	for _, val := range vals {
		msg := ValidateVar(val, params.validationTag)
		if msg != "" {
			msgs = append(msgs, msg)
		}
	}
	return filter, msgs
}

func validateFloat64Filter(
	rawVal string, op types_.FilterOp, params filterValidationParams,
) (types_.Filter, []string) {
	var filter types_.Filter
	var vals []float64
	var msgs []string
	filter.Op = op

	switch op {
	case types_.FilterEq, types_.FilterNe, types_.FilterGt, types_.FilterGte, types_.FilterLt, types_.FilterLte:
		val, err := strconv.ParseFloat(rawVal, 64)
		if err != nil {
			msg := fmt.Sprintf("%s is not a valid float", rawVal)
			return filter, []string{msg}
		}
		vals = append(vals, val)
		filter.Val = val
	case types_.FilterIn, types_.FilterNin:
		parts := strings.Split(rawVal, ",")
		for _, i := range parts {
			val, err := strconv.ParseFloat(i, 64)
			if err != nil {
				msgs = append(msgs, fmt.Sprintf("%s is not a valid float", i))
			} else {
				vals = append(vals, val)
			}
		}
		if len(msgs) > 0 {
			return filter, msgs
		}
		filter.Val = vals
	case types_.FilterExists:
		filter.Val = utils.StrToBool(rawVal)
		return filter, msgs
	default:
		msg := fmt.Sprintf("wrong filter operation for %s param. %s is not among eq, ne, gt, gte, lt, lte, in, nin, exists", params.fieldName, op)
		return filter, []string{msg}
	}

	// Validate the vals here
	for _, val := range vals {
		msg := ValidateVar(val, params.validationTag)
		if msg != "" {
			msgs = append(msgs, msg)
		}
	}
	return filter, msgs
}

func validateBoolFilter(
	rawVal string, op types_.FilterOp, params filterValidationParams,
) (types_.Filter, []string) {
	var filter types_.Filter
	var msgs []string
	filter.Op = op

	val := utils.StrToBool(rawVal)
	switch op {
	case types_.FilterEq, types_.FilterNe, types_.FilterExists:
		filter.Val = val
		return filter, msgs
	default:
		msg := fmt.Sprintf("wrong filter operation for %s param. %s is not among eq, ne, exists", params.fieldName, op)
		return filter, []string{msg}
	}
}

func validateTimeFilter(
	rawVal string, op types_.FilterOp, params filterValidationParams,
) (types_.Filter, []string) {
	var filter types_.Filter
	var vals []time.Time
	var msgs []string
	filter.Op = op

	switch op {
	case types_.FilterEq, types_.FilterNe, types_.FilterGt, types_.FilterGte, types_.FilterLt, types_.FilterLte:
		val, err := utils.ParseTime(rawVal)
		if err != nil {
			msg := fmt.Sprintf("%s is not a valid datetime", rawVal)
			return filter, []string{msg}
		}
		vals = append(vals, val)
		filter.Val = val
	case types_.FilterIn, types_.FilterNin:
		parts := strings.Split(rawVal, ",")
		for _, i := range parts {
			val, err := utils.ParseTime(i)
			if err != nil {
				msgs = append(msgs, fmt.Sprintf("%s is not a valid datetime", i))
			} else {
				vals = append(vals, val)
			}
		}
		if len(msgs) > 0 {
			return filter, msgs
		}
		filter.Val = vals
	case types_.FilterExists:
		filter.Val = utils.StrToBool(rawVal)
		return filter, msgs
	default:
		msg := fmt.Sprintf("wrong filter operation for %s param. %s is not among eq, ne, gt, gte, lt, lte, in, nin, exists", params.fieldName, op)
		return filter, []string{msg}
	}

	// Validate the vals here
	for _, val := range vals {
		msg := ValidateVar(val, params.validationTag)
		if msg != "" {
			msgs = append(msgs, msg)
		}
	}
	return filter, msgs
}
