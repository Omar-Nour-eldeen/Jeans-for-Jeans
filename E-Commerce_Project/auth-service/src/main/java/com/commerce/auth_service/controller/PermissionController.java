package com.commerce.auth_service.controller;

import java.util.List;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.commerce.auth_service.dto.PermissionRequest;
import com.commerce.auth_service.entity.Permission;
import com.commerce.auth_service.service.PermissionServiceImp;

import jakarta.validation.Valid;


@RestController
@RequestMapping("/admin/auth")
public class PermissionController {
    @Autowired
    private PermissionServiceImp permissionService;

    @GetMapping("/{userId}/permissions")
    public ResponseEntity<Set<String>> getUserPermissions(
            @PathVariable String userId) {

        return ResponseEntity.ok(
                permissionService.getEffectivePermissions(userId));
    }

    @PostMapping("/{userId}/permissions/grant")
    public ResponseEntity<Void> grantToUser(
            @PathVariable String userId,
            @Valid @RequestBody PermissionRequest req) {

        permissionService.grantPermissionToUser(userId, req.getPermission());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{userId}/permissions/revoke")
    public ResponseEntity<Void> revokeFromUser(
            @PathVariable String userId,
            @Valid @RequestBody PermissionRequest req) {

        permissionService.revokePermissionFromUser(userId, req.getPermission());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{userId}/permissions/reset")
    public ResponseEntity<Void> resetUserPermission(
            @PathVariable String userId,
            @Valid @RequestBody PermissionRequest req) {

        permissionService.resetUserPermission(userId, req.getPermission());
        return ResponseEntity.ok().build();
    }


    @GetMapping("/roles/{role}/permissions")
    public ResponseEntity<Set<String>> getRolePermissions(
            @PathVariable String role) {

        return ResponseEntity.ok(
                permissionService.getRolePermissions(role));
    }

    @PostMapping("/roles/{role}/permissions/grant")
    public ResponseEntity<Void> grantToRole(
            @PathVariable String role,
            @Valid @RequestBody PermissionRequest req) {

        permissionService.grantPermissionToRole(role, req.getPermission());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/roles/{role}/permissions/revoke")
    public ResponseEntity<Void> revokeFromRole(
            @PathVariable String role,
            @Valid @RequestBody PermissionRequest req) {

        permissionService.revokePermissionFromRole(role, req.getPermission());
        return ResponseEntity.ok().build();
    }


    @GetMapping("/permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(permissionService.getAllPermissions());
    }

}
