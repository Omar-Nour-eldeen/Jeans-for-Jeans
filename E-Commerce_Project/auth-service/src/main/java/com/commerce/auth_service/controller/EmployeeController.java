package com.commerce.auth_service.controller;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.commerce.auth_service.dto.AddEmployeeRequest;
import com.commerce.auth_service.dto.UserResponse;
import com.commerce.auth_service.service.EmployeeServiceImp;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/admin/auth/employees")
public class EmployeeController {
    
    @Autowired
    private EmployeeServiceImp employeeService;

    @PostMapping("/add")
    public ResponseEntity<UserResponse> addEmployee(
            @RequestHeader("User-Id") String requesterId,
            @Valid @RequestBody AddEmployeeRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(employeeService.addEmployee(requesterId, request));
    }

    @GetMapping("/all")
    public ResponseEntity<List<UserResponse>> getAllEmployees() {
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getEmployee(
            @PathVariable String id) {
        return ResponseEntity.ok(employeeService.getEmployee(id));
    }

    @PutMapping("/{id}/permissions")
    public ResponseEntity<Void> updatePermissions(
            @RequestHeader("User-Id") String requesterId,
            @PathVariable String id,
            @RequestBody Set<String> permissions) {

        employeeService.updateEmployeePermissions(requesterId, id, permissions);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(
            @RequestHeader("User-Id") String requesterId,
            @PathVariable String id) {

        employeeService.deleteEmployee(requesterId, id);
        return ResponseEntity.noContent().build();
    }
}
