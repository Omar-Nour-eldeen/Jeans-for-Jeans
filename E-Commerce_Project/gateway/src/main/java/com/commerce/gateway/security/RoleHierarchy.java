package com.commerce.gateway.security;

import java.util.Set;

public class RoleHierarchy {

    private static final Set<String> ELEVATED_ROLES = Set.of("ADMIN");

    public static boolean isElevatedRole(String role) {
        return ELEVATED_ROLES.contains(role);
    }

    private RoleHierarchy() {}
}