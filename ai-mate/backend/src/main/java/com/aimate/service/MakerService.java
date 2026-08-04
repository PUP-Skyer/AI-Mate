package com.aimate.service;

import com.aimate.entity.CollabSpace;
import com.aimate.entity.ContentPiece;
import com.aimate.entity.ContentVersion;
import com.aimate.exception.BusinessException;
import com.aimate.repository.CollabSpaceRepository;
import com.aimate.repository.ContentPieceRepository;
import com.aimate.repository.ContentVersionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MakerService {

    private final ContentPieceRepository contentPieceRepository;
    private final ContentVersionRepository contentVersionRepository;
    private final CollabSpaceRepository collabSpaceRepository;

    /**
     * 获取用户内容列表（分页）
     */
    @Transactional(readOnly = true)
    public Page<ContentPiece> getContentPieces(Long userId, String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        if (type != null && !type.isBlank()) {
            return contentPieceRepository.findByUserIdAndType(userId, type, pageable);
        }
        return contentPieceRepository.findByUserId(userId, pageable);
    }

    /**
     * 获取内容详情（含最新版本）
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getContentPiece(Long id) {
        ContentPiece piece = contentPieceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("内容不存在", HttpStatus.NOT_FOUND));

        List<ContentVersion> versions = contentVersionRepository.findByContentIdOrderByVersionDesc(id);
        ContentVersion latestVersion = versions.isEmpty() ? null : versions.get(0);

        Map<String, Object> detail = new HashMap<>();
        detail.put("content", piece);
        detail.put("latestVersion", latestVersion);
        detail.put("versionCount", versions.size());
        return detail;
    }

    /**
     * 创建内容
     */
    @Transactional
    public ContentPiece createContentPiece(ContentPiece piece) {
        ContentPiece content = ContentPiece.builder()
                .userId(piece.getUserId())
                .title(piece.getTitle())
                .type(piece.getType() != null ? piece.getType() : ContentPiece.ContentType.COPYWRITING)
                .platform(piece.getPlatform())
                .targetAudience(piece.getTargetAudience())
                .productInfo(piece.getProductInfo())
                .currentVersion(1)
                .status(ContentPiece.ContentStatus.DRAFT)
                .build();

        content = contentPieceRepository.save(content);
        log.info("用户 {} 创建内容: id={}, title={}", piece.getUserId(), content.getId(), content.getTitle());
        return content;
    }

    /**
     * 更新内容
     */
    @Transactional
    public ContentPiece updateContentPiece(Long id, ContentPiece piece) {
        ContentPiece content = contentPieceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("内容不存在", HttpStatus.NOT_FOUND));

        if (piece.getTitle() != null && !piece.getTitle().isBlank()) {
            content.setTitle(piece.getTitle());
        }
        if (piece.getType() != null) {
            content.setType(piece.getType());
        }
        if (piece.getPlatform() != null) {
            content.setPlatform(piece.getPlatform());
        }
        if (piece.getTargetAudience() != null) {
            content.setTargetAudience(piece.getTargetAudience());
        }
        if (piece.getProductInfo() != null) {
            content.setProductInfo(piece.getProductInfo());
        }
        if (piece.getStatus() != null) {
            content.setStatus(piece.getStatus());
        }

        content = contentPieceRepository.save(content);
        log.info("更新内容: id={}", id);
        return content;
    }

    /**
     * 删除内容（软删除）
     */
    @Transactional
    public void deleteContentPiece(Long id) {
        ContentPiece content = contentPieceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("内容不存在", HttpStatus.NOT_FOUND));

        content.setStatus(ContentPiece.ContentStatus.ARCHIVED);
        contentPieceRepository.save(content);
        log.info("删除内容: id={}", id);
    }

    /**
     * 获取内容版本历史
     */
    @Transactional(readOnly = true)
    public List<ContentVersion> getContentVersions(Long contentId) {
        return contentVersionRepository.findByContentIdOrderByVersionDesc(contentId);
    }

    /**
     * 创建内容新版本
     */
    @Transactional
    public ContentVersion createContentVersion(Long contentId, String content, String style) {
        ContentPiece piece = contentPieceRepository.findById(contentId)
                .orElseThrow(() -> new BusinessException("内容不存在", HttpStatus.NOT_FOUND));

        List<ContentVersion> versions = contentVersionRepository.findByContentIdOrderByVersionDesc(contentId);
        int nextVersion = versions.isEmpty() ? 1 : versions.get(0).getVersion() + 1;

        int wordCount = content != null ? content.length() : 0;

        ContentVersion version = ContentVersion.builder()
                .contentId(contentId)
                .version(nextVersion)
                .content(content)
                .style(style)
                .wordCount(wordCount)
                .build();

        version = contentVersionRepository.save(version);

        piece.setCurrentVersion(nextVersion);
        contentPieceRepository.save(piece);

        log.info("内容 {} 创建新版本: version={}", contentId, nextVersion);
        return version;
    }

    /**
     * 获取用户的协作空间列表
     */
    @Transactional(readOnly = true)
    public List<CollabSpace> getSpaces(Long userId) {
        return collabSpaceRepository.findByOwnerId(userId);
    }

    /**
     * 创建协作空间
     */
    @Transactional
    public CollabSpace createSpace(CollabSpace space) {
        CollabSpace newSpace = CollabSpace.builder()
                .name(space.getName())
                .description(space.getDescription())
                .ownerId(space.getOwnerId())
                .memberCount(1)
                .contentCount(0)
                .status(CollabSpace.SpaceStatus.ACTIVE)
                .build();

        newSpace = collabSpaceRepository.save(newSpace);
        log.info("用户 {} 创建协作空间: id={}, name={}", space.getOwnerId(), newSpace.getId(), newSpace.getName());
        return newSpace;
    }

    /**
     * 获取协作空间详情
     */
    @Transactional(readOnly = true)
    public CollabSpace getSpace(Long id) {
        return collabSpaceRepository.findById(id)
                .orElseThrow(() -> new BusinessException("协作空间不存在", HttpStatus.NOT_FOUND));
    }
}
