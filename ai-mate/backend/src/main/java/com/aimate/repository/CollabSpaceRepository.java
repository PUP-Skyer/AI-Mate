package com.aimate.repository;

import com.aimate.entity.CollabSpace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollabSpaceRepository extends JpaRepository<CollabSpace, Long> {

    List<CollabSpace> findByOwnerId(Long ownerId);
}
