package com.commerce.auth_service.interfaces;

import java.util.List;
import java.util.Set;

import com.commerce.auth_service.dto.AddEmployeeRequest;
import com.commerce.auth_service.dto.UserResponse;

public interface IEmployeeService {
    UserResponse addEmployee(String requesterId, AddEmployeeRequest request);
    void updateEmployeePermissions(String requesterId, String employeeId, Set<String> newPermissions);
    UserResponse getEmployee(String employeeId);
    List<UserResponse> getAllEmployees();
    void deleteEmployee(String requesterId, String employeeId);
}
