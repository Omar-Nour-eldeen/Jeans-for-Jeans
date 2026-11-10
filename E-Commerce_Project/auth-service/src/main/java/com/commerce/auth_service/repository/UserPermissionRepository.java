package com.commerce.auth_service.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.commerce.auth_service.entity.UserPermission;

@Repository
public interface UserPermissionRepository
                extends JpaRepository<UserPermission, UserPermission.UserPermissionId> {

        @Query("SELECT up FROM UserPermission up " +
                        "JOIN FETCH up.permission " +
                        "WHERE up.user.id = :userId")
        List<UserPermission> findByUserId(@Param("userId") String userId);

        @Modifying
        @Query("DELETE FROM UserPermission up " +
                        "WHERE up.user.id = :userId " +
                        "AND up.permission.id = :permissionId")
        void deleteByUserIdAndPermissionId(@Param("userId") String userId,
                        @Param("permissionId") String permissionId);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Query("DELETE FROM UserPermission up WHERE up.user.id = :userId")
        void deleteAllByUserId(@Param("userId") String userId);
}
