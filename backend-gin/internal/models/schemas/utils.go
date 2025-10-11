package schemas

import (
	"backend/internal/config"
	"backend/internal/lib/utils"
	"backend/internal/types_"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"time"
)

func BuildFindQuery(
	filters any, findQuery *types_.FindQuery,
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
			val, err := strconv.Atoi(value.String())
			if err != nil || val <= 0 {
				result["page"] = []string{"Page value must be a positive integer"}
			}
			findQuery.Page = val
		case "Size":
			val, err := strconv.Atoi(value.String())
			if err != nil || val <= 0 || val > config.Env.MaxItemsPerPage {
				result["size"] = []string{fmt.Sprintf("Page value must be an integer between 1 and %d", config.Env.MaxItemsPerPage)}
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
				findQuery.Filters[type_.Name] = val
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
	msg := utils.ValidateVar(val, tag)
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
	var msgs []string
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
		return filters, msgs
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
	for _, strFilter := range strFilters {
		filter, filterMsgs := validateFilter(strFilter, params)
		if len(filterMsgs) > 0 {
			msgs = append(msgs, filterMsgs...)
		} else {
			filters = append(filters, filter)
		}
	}

	return filters, msgs
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
	case "int":
		return validateIntFilter(rawVal, op, params)
	case "float64":
		return validateFloat64Filter(rawVal, op, params)
	case "bool":
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
		msg := utils.ValidateVar(val, params.validationTag)
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
		msg := utils.ValidateVar(val, params.validationTag)
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
		msg := utils.ValidateVar(val, params.validationTag)
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
		msg := utils.ValidateVar(val, params.validationTag)
		if msg != "" {
			msgs = append(msgs, msg)
		}
	}
	return filter, msgs
}
