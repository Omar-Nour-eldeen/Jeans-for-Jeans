package com.commerce.auth_service.interfaces;

import java.util.List;
import java.util.Set;

import com.commerce.auth_service.entity.Permission;
import com.commerce.auth_service.entity.User;

public interface IPermissionService {
    Set<String> getEffectivePermissions(String userId);
    boolean hasPermission(User user, String permissionName);
    void grantPermissionToUser(String userId, String permissionName);
    void revokePermissionFromUser(String userId, String permissionName);
    void resetUserPermission(String userId, String permissionName);
    void grantPermissionToRole(String role, String permissionName);
    void revokePermissionFromRole(String role, String permissionName);
    Set<String> getRolePermissions(String role);
    List<Permission> getAllPermissions();
}
