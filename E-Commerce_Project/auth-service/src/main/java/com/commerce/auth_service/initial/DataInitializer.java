package com.commerce.auth_service.initial;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.commerce.auth_service.entity.Permission;
import com.commerce.auth_service.entity.RolePermission;
import com.commerce.auth_service.entity.User;
import com.commerce.auth_service.repository.PermissionRepository;
import com.commerce.auth_service.repository.RolePermissionRepository;
import com.commerce.auth_service.repository.UserRepository;

import jakarta.transaction.Transactional;

@Component
public class DataInitializer implements ApplicationRunner {
    @Autowired
    private  PermissionRepository permissionRepository;
    @Autowired
    private  RolePermissionRepository rolePermissionRepository;
    @Autowired
    private  UserRepository userRepository;
    @Autowired
    private  PasswordEncoder passwordEncoder;

    @Value("${SUPER_ADMIN_EMAIL:}")
    private String superAdminEmail;

    @Value("${SUPER_ADMIN_PASSWORD:}")
    private String superAdminPassword;

    private static final Map<String, String> ALL_PERMISSIONS = Map.ofEntries(
        // Product
        Map.entry("product:read",    "View products"),
        Map.entry("product:create",  "Create new products"),
        Map.entry("product:update",  "Update existing products"),
        Map.entry("product:delete",  "Delete products"),
        // Category
        Map.entry("category:read",   "View categories"),
        Map.entry("category:create", "Create new categories"),
        Map.entry("category:update", "Update existing categories"),
        Map.entry("category:delete", "Delete categories"),
        // Order
        Map.entry("order:read",      "View orders"),
        Map.entry("order:create",    "Create new orders"),
        Map.entry("order:update",    "Update order details"),
        Map.entry("order:cancel",    "Cancel orders"),
        Map.entry("order:delete",    "Delete orders"),
        // Cart (Customer)
        Map.entry("cart:create",     "Create Cart"),
        Map.entry("cart:update",     "Update Cart"),
        Map.entry("cart:delete-item","Delete Item from Cart"),
        Map.entry("cart:add-item",   "Add Item to Cart"),
        Map.entry("cart:clear",      "Clear Cart"),
        Map.entry("cart:read",       "View Cart"),
        // User
        Map.entry("user:read",       "View user profiles"),
        // Employee
        Map.entry("employee:read",   "View employees"),
        Map.entry("employee:create", "Create new employees"),
        Map.entry("employee:update", "Update employee permissions"),
        Map.entry("employee:delete", "Delete employees"),
        // Admin Dashboard
        Map.entry("admin:dashboard", "View admin dashboard")
    );

    private static final Set<String> USER_PERMISSIONS = Set.of(
        "product:read",
        "category:read",
        "order:read",
        "order:create",
        "order:cancel",
        "user:read",
        "cart:create",
        "cart:update",
        "cart:delete-item",
        "cart:add-item",
        "cart:clear",
        "cart:read"
    );

    private static final Set<String> EMPLOYEE_DEFAULT_PERMISSIONS = Set.of(
        "product:read",
        "category:read",
        "order:read",
        "admin:dashboard"
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        ALL_PERMISSIONS.forEach((name, description) -> {
            if (!permissionRepository.existsByName(name)) {
                Permission permission = Permission.builder()
                        .name(name)
                        .description(description)
                        .build();
                permissionRepository.save(permission);
            }
        });

        List<Permission> allPerms = permissionRepository.findAll();

        // 1. ADMIN gets all permissions
        allPerms.forEach(permission -> {
            RolePermission.RolePermissionId adminId =
                new RolePermission.RolePermissionId(
                    "ADMIN", permission.getId());

            if (!rolePermissionRepository.existsById(adminId)) {
                rolePermissionRepository.save(
                    RolePermission.builder()
                        .id(adminId)
                        .role(User.Role.ADMIN)
                        .permission(permission)
                        .build()
                );
            }
        });

        // 2. USER gets USER_PERMISSIONS & clean up obsolete permissions for USER
        List<RolePermission> currentRoleUserPerms = rolePermissionRepository.findByRole("USER");
        for (RolePermission rp : currentRoleUserPerms) {
            if (!USER_PERMISSIONS.contains(rp.getPermission().getName())) {
                rolePermissionRepository.delete(rp);
            }
        }

        allPerms.stream()
                .filter(p -> USER_PERMISSIONS.contains(p.getName()))
                .forEach(permission -> {
                    RolePermission.RolePermissionId userId =
                        new RolePermission.RolePermissionId(
                            "USER", permission.getId());

                    if (!rolePermissionRepository.existsById(userId)) {
                        rolePermissionRepository.save(
                            RolePermission.builder()
                                .id(userId)
                                .role(User.Role.USER)
                                .permission(permission)
                                .build()
                        );
                    }
                });

        // 3. EMPLOYEE gets base default permissions
        allPerms.stream()
                .filter(p -> EMPLOYEE_DEFAULT_PERMISSIONS.contains(p.getName()))
                .forEach(permission -> {
                    RolePermission.RolePermissionId empId =
                        new RolePermission.RolePermissionId(
                            "EMPLOYEE", permission.getId());

                    if (!rolePermissionRepository.existsById(empId)) {
                        rolePermissionRepository.save(
                            RolePermission.builder()
                                .id(empId)
                                .role(User.Role.EMPLOYEE)
                                .permission(permission)
                                .build()
                        );
                    }
                });

        initSuperAdmin();
    }

    private void initSuperAdmin() {
        if (superAdminEmail == null || superAdminEmail.isBlank() ||
            superAdminPassword == null || superAdminPassword.isBlank()) {
            return;
        }

        if (userRepository.existsByEmail(superAdminEmail)) {
            return;
        }

        User superAdmin = User.builder()
                .email(superAdminEmail)
                .passwordHash(passwordEncoder.encode(superAdminPassword))
                .role(User.Role.ADMIN)
                .status(User.Status.ACTIVE)
                .build();

        userRepository.save(superAdmin);
    }

}