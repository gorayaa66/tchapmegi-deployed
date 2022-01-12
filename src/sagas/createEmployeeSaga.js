import { call, put, takeLatest, select } from 'redux-saga/effects';
import axios from 'axios';
import { getToken } from '../lib/api';
import { getEmployeeDetails } from '../selectors/employees';
import { readAsFile, revokeObjectURL } from '../lib/api';
import { getAPIRoot } from '../config';
import { employees } from '../constants';
import {
    authEmployee,
    createEmpSuccessful,
    createEmpFailed
} from '../actions/employees';
import {
    addError
} from '../actions/error';

export function* createEmployeeSaga() {
    try {
        const employee_data = yield select(getEmployeeDetails); 
        const file = yield call(fetch, employee_data.avatar);
        const data = yield call([file, file.blob]);
        const avatar = yield call(readAsFile, data);
        const payload = {
            payload: {
                ...employee_data,
                avatar
	    }
        }; 
        const headers = yield call(getToken);
        const API_ROOT = yield call(getAPIRoot, 'employees', 'v1');
        const response = yield call(axios.post, `${API_ROOT}/create-employee`, {...payload.payload}, { headers: headers });
        if(response.data.status === 'fail') {
            yield put(createEmpFailed());
            yield put(addError(response.data.data));
        } else {
            yield put(authEmployee());
            yield put(createEmpSuccessful(response.data.data.employee));
            yield call(revokeObjectURL, employee_data.avatar);
        }
    } catch(error) {
        yield put(createEmpFailed());
        yield put(addError({message: 'Failed while sending request'}));
    }
};

export function* watchCreateEmployeeSaga() {
    yield takeLatest(employees.CREATE_EMP, createEmployeeSaga);
};
