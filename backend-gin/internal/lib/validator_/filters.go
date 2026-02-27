package validator_

import (
	"backend/internal/lib/types_"
	"backend/internal/lib/utils"
	"fmt"
	"strconv"
	"strings"
	"time"
)

func ToIntFilters(values []string, validationTag string) ([]types_.Filter, []string) {
	filters := make([]types_.Filter, 0, len(values))
	errMessages := make([]string, 0, len(values))

	if len(values) == 0 {
		return filters, errMessages
	}

	for _, value := range values {
		filter := types_.StringToFilter(value)
		switch filter.Op {
		case types_.FilterEq, types_.FilterNe,
			types_.FilterGt, types_.FilterGte, types_.FilterLt, types_.FilterLte:
			val, err := strconv.Atoi(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid integer", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			if msg := ValidateVar(val, validationTag); msg != "" {
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = val
			filters = append(filters, filter)
		case types_.FilterNull:
			boolVal, err := utils.CheckBool(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid boolean for null filter", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = boolVal
			filters = append(filters, filter)
		case types_.FilterIn, types_.FilterNin:
			errFound := false
			parts := strings.Split(filter.Val.(string), ",")
			parsed := make([]int, 0, len(parts))
			for _, i := range parts {
				val, err := strconv.Atoi(i)
				if err != nil {
					errFound = true
					msg := fmt.Sprintf("%s is not a valid integer", i)
					errMessages = append(errMessages, msg)
					continue
				}
				if msg := ValidateVar(val, validationTag); msg != "" {
					errFound = true
					errMessages = append(errMessages, msg)
					continue
				}
				parsed = append(parsed, val)
			}
			if errFound {
				continue
			}
			filter.Val = parsed
			filters = append(filters, filter)
		default:
			msg := fmt.Sprintf("wrong filter operation: %s is not among eq,ne,null,gt,gte,lt,lte,in,nin", filter.Op)
			errMessages = append(errMessages, msg)
		}
	}

	errs := ValidateFilterLogic(filters)
	errMessages = append(errMessages, errs...)
	return filters, errMessages
}

func ToFloat64Filters(values []string, validationTag string) ([]types_.Filter, []string) {
	filters := make([]types_.Filter, 0, len(values))
	errMessages := make([]string, 0, len(values))

	if len(values) == 0 {
		return filters, errMessages
	}

	for _, value := range values {
		filter := types_.StringToFilter(value)
		switch filter.Op {
		case types_.FilterEq, types_.FilterNe,
			types_.FilterGt, types_.FilterGte, types_.FilterLt, types_.FilterLte:
			val, err := strconv.ParseFloat(filter.Val.(string), 64)
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid float", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			if msg := ValidateVar(val, validationTag); msg != "" {
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = val
			filters = append(filters, filter)
		case types_.FilterNull:
			boolVal, err := utils.CheckBool(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid boolean for null filter", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = boolVal
			filters = append(filters, filter)
		case types_.FilterIn, types_.FilterNin:
			errFound := false
			parts := strings.Split(filter.Val.(string), ",")
			parsed := make([]float64, 0, len(parts))
			for _, i := range parts {
				val, err := strconv.ParseFloat(i, 64)
				if err != nil {
					errFound = true
					msg := fmt.Sprintf("%s is not a valid float", i)
					errMessages = append(errMessages, msg)
					continue
				}
				if msg := ValidateVar(val, validationTag); msg != "" {
					errFound = true
					errMessages = append(errMessages, msg)
					continue
				}
				parsed = append(parsed, val)
			}
			if errFound {
				continue
			}
			filter.Val = parsed
			filters = append(filters, filter)
		default:
			msg := fmt.Sprintf("wrong filter operation: %s is not among eq,ne,null,gt,gte,lt,lte,in,nin", filter.Op)
			errMessages = append(errMessages, msg)
		}
	}

	errs := ValidateFilterLogic(filters)
	errMessages = append(errMessages, errs...)
	return filters, errMessages
}

func ToIndexFilters(values []string) ([]types_.Filter, []string) {
	filters := make([]types_.Filter, 0, len(values))
	errMessages := make([]string, 0, len(values))

	if len(values) == 0 {
		return filters, errMessages
	}

	for _, value := range values {
		filter := types_.StringToFilter(value)
		switch filter.Op {
		case types_.FilterEq, types_.FilterNe:
			val, err := strconv.Atoi(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid index (must be integer)", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = val
			filters = append(filters, filter)
		case types_.FilterNull:
			boolVal, err := utils.CheckBool(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid boolean for null filter", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = boolVal
			filters = append(filters, filter)
		case types_.FilterIn, types_.FilterNin:
			errFound := false
			parts := strings.Split(filter.Val.(string), ",")
			parsed := make([]int, 0, len(parts))
			for _, i := range parts {
				val, err := strconv.Atoi(i)
				if err != nil {
					errFound = true
					msg := fmt.Sprintf("%s is not a valid index (must be integer)", i)
					errMessages = append(errMessages, msg)
					continue
				}
				parsed = append(parsed, val)
			}
			if errFound {
				continue
			}
			filter.Val = parsed
			filters = append(filters, filter)
		default:
			msg := fmt.Sprintf("wrong filter operation: %s is not allowed for indexes, not among eq,ne,null,in,nin", filter.Op)
			errMessages = append(errMessages, msg)
		}
	}

	errs := ValidateFilterLogic(filters)
	errMessages = append(errMessages, errs...)
	return filters, errMessages
}

func ToStringFilters(values []string, validationTag string) ([]types_.Filter, []string) {
	filters := make([]types_.Filter, 0, len(values))
	errMessages := make([]string, 0, len(values))

	if len(values) == 0 {
		return filters, errMessages
	}

	for _, value := range values {
		filter := types_.StringToFilter(value)
		switch filter.Op {
		case types_.FilterEq, types_.FilterNe:
			strVal := filter.Val.(string)
			if msg := ValidateVar(strVal, validationTag); msg != "" {
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = strVal
			filters = append(filters, filter)
		case types_.FilterLike, types_.FilterIlike:
			// No validation for like/ilike - they contain partial patterns
			strVal := filter.Val.(string)
			filter.Val = strVal
			filters = append(filters, filter)
		case types_.FilterNull:
			boolVal, err := utils.CheckBool(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid boolean for null filter", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = boolVal
			filters = append(filters, filter)
		case types_.FilterIn, types_.FilterNin:
			errFound := false
			parts := strings.Split(filter.Val.(string), ",")
			parsed := make([]string, 0, len(parts))
			for _, i := range parts {
				if msg := ValidateVar(i, validationTag); msg != "" {
					errFound = true
					errMessages = append(errMessages, msg)
					continue
				}
				parsed = append(parsed, i)
			}
			if errFound {
				continue
			}
			filter.Val = parsed
			filters = append(filters, filter)
		default:
			msg := fmt.Sprintf("wrong filter operation: %s is not among eq,ne,in,nin,null,like,ilike", filter.Op)
			errMessages = append(errMessages, msg)
		}
	}

	errs := ValidateFilterLogic(filters)
	errMessages = append(errMessages, errs...)
	return filters, errMessages
}

func ToBooleanFilters(values []string) ([]types_.Filter, []string) {
	filters := make([]types_.Filter, 0, len(values))
	errMessages := make([]string, 0, len(values))

	if len(values) == 0 {
		return filters, errMessages
	}

	for _, value := range values {
		filter := types_.StringToFilter(value)
		switch filter.Op {
		case types_.FilterEq, types_.FilterNe, types_.FilterNull:
			boolVal, err := utils.CheckBool(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid boolean (use true/false, 1/0, yes/no)", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = boolVal
			filters = append(filters, filter)
		default:
			msg := fmt.Sprintf("wrong filter operation: %s is not allowed for booleans (use eq,ne,null)", filter.Op)
			errMessages = append(errMessages, msg)
		}
	}

	errs := ValidateFilterLogic(filters)
	errMessages = append(errMessages, errs...)
	return filters, errMessages
}

func ToTimeFilters(values []string, validationTag string) ([]types_.Filter, []string) {
	filters := make([]types_.Filter, 0, len(values))
	errMessages := make([]string, 0, len(values))

	if len(values) == 0 {
		return filters, errMessages
	}

	for _, value := range values {
		filter := types_.StringToFilter(value)
		switch filter.Op {
		case types_.FilterEq, types_.FilterNe,
			types_.FilterGt, types_.FilterGte, types_.FilterLt, types_.FilterLte:
			val, err := utils.ParseTime(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid time format", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			if msg := ValidateVar(val, validationTag); msg != "" {
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = val
			filters = append(filters, filter)
		case types_.FilterNull:
			boolVal, err := utils.CheckBool(filter.Val.(string))
			if err != nil {
				msg := fmt.Sprintf("%s is not a valid boolean for null filter", filter.Val)
				errMessages = append(errMessages, msg)
				continue
			}
			filter.Val = boolVal
			filters = append(filters, filter)
		case types_.FilterIn, types_.FilterNin:
			errFound := false
			parts := strings.Split(filter.Val.(string), ",")
			parsed := make([]time.Time, 0, len(parts))
			for _, i := range parts {
				val, err := utils.ParseTime(i)
				if err != nil {
					errFound = true
					msg := fmt.Sprintf("%s is not a valid time format", i)
					errMessages = append(errMessages, msg)
					continue
				}
				if msg := ValidateVar(val, validationTag); msg != "" {
					errFound = true
					errMessages = append(errMessages, msg)
					continue
				}
				parsed = append(parsed, val)
			}
			if errFound {
				continue
			}
			filter.Val = parsed
			filters = append(filters, filter)
		default:
			msg := fmt.Sprintf("wrong filter operation: %s is not among eq,ne,null,gt,gte,lt,lte,in,nin", filter.Op)
			errMessages = append(errMessages, msg)
		}
	}

	errs := ValidateFilterLogic(filters)
	errMessages = append(errMessages, errs...)
	return filters, errMessages
}

func ValidateFilterLogic(filters []types_.Filter) []string {
	var errMessages []string

	if len(filters) <= 1 {
		return errMessages
	}

	// Collect all operators
	usedOps := make(map[types_.FilterOp]int)
	var opList []types_.FilterOp

	for _, filter := range filters {
		usedOps[filter.Op]++
		opList = append(opList, filter.Op)
	}

	// Rule 0: No operator used twice
	for op, count := range usedOps {
		if count > 1 {
			msg := fmt.Sprintf("cannot use operator %s multiple times for the same field", op)
			errMessages = append(errMessages, msg)
		}
	}

	// Early return: if only one unique operator, no conflicts possible
	if len(usedOps) == 1 {
		return errMessages
	}

	// From here on, length is guaranteed >= 2
	_, eqUsed := usedOps[types_.FilterEq]
	_, nullUsed := usedOps[types_.FilterNull]
	_, inUsed := usedOps[types_.FilterIn]
	_, gtUsed := usedOps[types_.FilterGt]
	_, gteUsed := usedOps[types_.FilterGte]
	_, ltUsed := usedOps[types_.FilterLt]
	_, lteUsed := usedOps[types_.FilterLte]
	_, likeUsed := usedOps[types_.FilterLike]
	_, ilikeUsed := usedOps[types_.FilterIlike]

	// Rule 1: eq should be used exclusively
	if eqUsed {
		msg := fmt.Sprintf("eq can only be used exclusively, but found: %v", opList)
		errMessages = append(errMessages, msg)
	} else if nullUsed {
		// Rule 2: null should be used exclusively (if eq not used)
		msg := fmt.Sprintf("null operator should be used exclusively, but found: %v", opList)
		errMessages = append(errMessages, msg)
	} else if inUsed {
		// Rule 3: in should be used exclusively (if eq not used)
		msg := fmt.Sprintf("in operator should be used exclusively, but found: %v", opList)
		errMessages = append(errMessages, msg)
	}

	// Rule 4: gt/gte cannot be used together
	if gtUsed && gteUsed {
		errMessages = append(errMessages, "gt and gte operators should not be used together")
	}

	// Rule 5: lt/lte cannot be used together
	if ltUsed && lteUsed {
		errMessages = append(errMessages, "lt and lte operators should not be used together")
	}

	// Rule 6: like/ilike cannot be used together
	if likeUsed && ilikeUsed {
		errMessages = append(errMessages, "like and ilike operators should not be used together")
	}

	return errMessages
}
