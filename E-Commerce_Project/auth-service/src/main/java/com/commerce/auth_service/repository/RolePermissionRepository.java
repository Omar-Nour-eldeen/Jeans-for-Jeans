package com.commerce.auth_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.commerce.auth_service.entity.RolePermission;

@Repository
public interface RolePermissionRepository
                extends JpaRepository<RolePermission, RolePermission.RolePermissionId> {

        @Query("SELECT rp FROM RolePermission rp " +
                        "JOIN FETCH rp.permission " +
                        "WHERE rp.id.role = :role")
        List<RolePermission> findByRole(@Param("role") String role);

        boolean existsByIdRoleAndIdPermissionId(String role, String permissionId);

        @Modifying
        @Query("DELETE FROM RolePermission rp " +
                        "WHERE rp.id.role = :role " +
                        "AND rp.id.permissionId = :permissionId")
        void deleteByRoleAndPermissionId(@Param("role") String role,
                        @Param("permissionId") String permissionId);
}
