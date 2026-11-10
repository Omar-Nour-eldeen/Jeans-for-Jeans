package com.commerce.auth_service.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.commerce.auth_service.entity.*;
import com.commerce.auth_service.exception.ResourceNotFoundException;
import com.commerce.auth_service.interfaces.IPermissionService;
import com.commerce.auth_service.repository.*;

import jakarta.transaction.Transactional;


@Service
public class PermissionServiceImp implements IPermissionService {
    
    @Autowired
    private PermissionRepository permissionRepository;
    @Autowired
    private RolePermissionRepository rolePermissionRepository;
    @Autowired  
    private UserPermissionRepository userPermissionRepository;
    @Autowired
    private UserRepository userRepository;

    public Set<String> getEffectivePermissions(String userId) {
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));

        if (user.getRole() == User.Role.ADMIN) {
            return permissionRepository.findAll()
                    .stream()
                    .map(Permission::getName)
                    .collect(Collectors.toUnmodifiableSet());
        }

        if (user.getRole() == User.Role.EMPLOYEE) {
            return userPermissionRepository.findByUserId(user.getId())
                    .stream()
                    .filter(UserPermission::isGranted)
                    .map(up -> up.getPermission().getName())
                    .collect(Collectors.toUnmodifiableSet());
        }

        List<UserPermission> userOverrides = userPermissionRepository
            .findByUserId(user.getId());

        Set<String> effective = rolePermissionRepository
                .findByRole(user.getRole().name())
                .stream()
                .map(rp -> rp.getPermission().getName())
                .collect(Collectors.toCollection(HashSet::new));

        userOverrides
                .forEach(up -> {
                    if (up.isGranted()) {
                        effective.add(up.getPermission().getName());
                    } else {
                        effective.remove(up.getPermission().getName());
                    }
                });

        return Collections.unmodifiableSet(effective);
    }

    public boolean hasPermission(User user, String permissionName) {
        return getEffectivePermissions(user.getId()).contains(permissionName);
    }

    @Transactional
    public void grantPermissionToUser(String userId, String permissionName) {
        User user = findUserOrThrow(userId);
        Permission permission = findPermissionOrThrow(permissionName);

        UserPermission up = UserPermission.builder()
                .id(new UserPermission.UserPermissionId(
                        userId, permission.getId()))
                .user(user)
                .permission(permission)
                .granted(true)
                .build();

        userPermissionRepository.save(up);
    }

    @Transactional
    public void revokePermissionFromUser(String userId, String permissionName) {
        User user = findUserOrThrow(userId);
        Permission permission = findPermissionOrThrow(permissionName);

        UserPermission up = UserPermission.builder()
                .id(new UserPermission.UserPermissionId(
                        userId, permission.getId()))
                .user(user)
                .permission(permission)
                .granted(false)
                .build();

        userPermissionRepository.save(up);
    }

    @Transactional
    public void resetUserPermission(String userId, String permissionName) {
        Permission permission = findPermissionOrThrow(permissionName);
        userPermissionRepository.deleteByUserIdAndPermissionId(
                userId, permission.getId());
    }


    @Transactional
    public void grantPermissionToRole(String role, String permissionName) {
        User.Role.valueOf(role.toUpperCase());

        Permission permission = findPermissionOrThrow(permissionName);

        boolean alreadyExists = rolePermissionRepository
                .existsByIdRoleAndIdPermissionId(
                        role.toUpperCase(), permission.getId());

        if (!alreadyExists) {
            RolePermission rp = RolePermission.builder()
                    .id(new RolePermission.RolePermissionId(
                            role.toUpperCase(), permission.getId()))
                    .role(User.Role.valueOf(role.toUpperCase()))
                    .permission(permission)
                    .build();

            rolePermissionRepository.save(rp);
        }
    }

    @Transactional
    public void revokePermissionFromRole(String role, String permissionName) {
        User.Role.valueOf(role.toUpperCase()); 

        Permission permission = findPermissionOrThrow(permissionName);

        rolePermissionRepository.deleteByRoleAndPermissionId(
                role.toUpperCase(), permission.getId());

    }

    public Set<String> getRolePermissions(String role) {
        User.Role.valueOf(role.toUpperCase()); 

        return rolePermissionRepository.findByRole(role.toUpperCase())
                .stream()
                .map(rp -> rp.getPermission().getName())
                .collect(Collectors.toUnmodifiableSet());
    }

    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    private User findUserOrThrow(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                    new ResourceNotFoundException("User", userId));
    }

    private Permission findPermissionOrThrow(String name) {
        return permissionRepository.findByName(name)
                .orElseThrow(() ->
                    new ResourceNotFoundException("Permission: " + name));
    }
}