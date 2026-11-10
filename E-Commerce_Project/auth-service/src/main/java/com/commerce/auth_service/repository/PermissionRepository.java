package com.commerce.auth_service.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.commerce.auth_service.entity.Permission;

@Repository
public interface PermissionRepository
                extends JpaRepository<Permission, String> {

        Optional<Permission> findByName(String name);

        @Query("SELECT p FROM Permission p " +
                        "JOIN RolePermission rp ON rp.permission.id = p.id " +
                        "WHERE rp.id.role = :role")
        List<Permission> findByRole(@Param("role") String role);

        boolean existsByName(String name);
}
