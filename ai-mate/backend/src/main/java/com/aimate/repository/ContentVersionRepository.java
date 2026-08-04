package com.aimate.repository;

import com.aimate.entity.ContentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContentVersionRepository extends JpaRepository<ContentVersion, Long> {

    List<ContentVersion> findByContentIdOrderByVersionDesc(Long contentId);
}
