package com.aimate.service;

import com.aimate.entity.DataAnalysisTask;
import com.aimate.entity.DocumentSection;
import com.aimate.entity.StrategyDocument;
import com.aimate.exception.BusinessException;
import com.aimate.repository.DataAnalysisTaskRepository;
import com.aimate.repository.DocumentSectionRepository;
import com.aimate.repository.StrategyDocumentRepository;
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
public class SageService {

    private final StrategyDocumentRepository strategyDocumentRepository;
    private final DocumentSectionRepository documentSectionRepository;
    private final DataAnalysisTaskRepository dataAnalysisTaskRepository;

    /**
     * 获取用户文档列表（分页）
     */
    @Transactional(readOnly = true)
    public Page<StrategyDocument> getDocuments(Long userId, String type, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        if (type != null && !type.isBlank()) {
            return strategyDocumentRepository.findByUserIdAndStatus(userId, type, pageable);
        }
        return strategyDocumentRepository.findByUserId(userId, pageable);
    }

    /**
     * 获取文档详情（含章节列表）
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getDocument(Long id) {
        StrategyDocument document = strategyDocumentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("文档不存在", HttpStatus.NOT_FOUND));

        List<DocumentSection> sections = documentSectionRepository.findByDocumentIdOrderByOrderNum(id);

        Map<String, Object> detail = new HashMap<>();
        detail.put("document", document);
        detail.put("sections", sections);
        return detail;
    }

    /**
     * 创建文档
     */
    @Transactional
    public StrategyDocument createDocument(Long userId, StrategyDocument doc) {
        StrategyDocument document = StrategyDocument.builder()
                .userId(userId)
                .title(doc.getTitle())
                .type(doc.getType() != null ? doc.getType() : StrategyDocument.DocumentType.STRATEGY)
                .templateId(doc.getTemplateId())
                .content(doc.getContent())
                .status(StrategyDocument.DocumentStatus.DRAFT)
                .version(1)
                .build();

        document = strategyDocumentRepository.save(document);
        log.info("用户 {} 创建策略文档: id={}, title={}", userId, document.getId(), document.getTitle());
        return document;
    }

    /**
     * 更新文档
     */
    @Transactional
    public StrategyDocument updateDocument(Long id, StrategyDocument doc) {
        StrategyDocument document = strategyDocumentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("文档不存在", HttpStatus.NOT_FOUND));

        if (doc.getTitle() != null && !doc.getTitle().isBlank()) {
            document.setTitle(doc.getTitle());
        }
        if (doc.getType() != null) {
            document.setType(doc.getType());
        }
        if (doc.getContent() != null) {
            document.setContent(doc.getContent());
        }
        if (doc.getTemplateId() != null) {
            document.setTemplateId(doc.getTemplateId());
        }
        if (doc.getStatus() != null) {
            document.setStatus(doc.getStatus());
        }

        document.setVersion(document.getVersion() + 1);
        document = strategyDocumentRepository.save(document);
        log.info("更新策略文档: id={}, version={}", id, document.getVersion());
        return document;
    }

    /**
     * 删除文档（软删除）
     */
    @Transactional
    public void deleteDocument(Long id) {
        StrategyDocument document = strategyDocumentRepository.findById(id)
                .orElseThrow(() -> new BusinessException("文档不存在", HttpStatus.NOT_FOUND));

        document.setStatus(StrategyDocument.DocumentStatus.DRAFT);
        strategyDocumentRepository.save(document);
        log.info("删除策略文档: id={}", id);
    }

    /**
     * 生成章节（标记为 GENERATING 状态，实际 AI 调用由前端通过代理完成）
     */
    @Transactional
    public DocumentSection generateSection(Long documentId, String sectionKey) {
        StrategyDocument document = strategyDocumentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException("文档不存在", HttpStatus.NOT_FOUND));

        List<DocumentSection> sections = documentSectionRepository.findByDocumentIdOrderByOrderNum(documentId);
        DocumentSection section = sections.stream()
                .filter(s -> s.getSectionKey().equals(sectionKey))
                .findFirst()
                .orElseGet(() -> {
                    DocumentSection newSection = DocumentSection.builder()
                            .documentId(documentId)
                            .sectionKey(sectionKey)
                            .title(sectionKey)
                            .status(DocumentSection.SectionStatus.DRAFT)
                            .orderNum(sections.size())
                            .build();
                    return documentSectionRepository.save(newSection);
                });

        section.setStatus(DocumentSection.SectionStatus.GENERATING);
        section.setAiGenerated(true);
        section = documentSectionRepository.save(section);
        log.info("文档 {} 章节 {} 标记为生成中", documentId, sectionKey);
        return section;
    }

    /**
     * 审阅文档（返回文档及章节供 AI 审阅）
     */
    @Transactional(readOnly = true)
    public Map<String, Object> reviewDocument(Long documentId) {
        StrategyDocument document = strategyDocumentRepository.findById(documentId)
                .orElseThrow(() -> new BusinessException("文档不存在", HttpStatus.NOT_FOUND));

        List<DocumentSection> sections = documentSectionRepository.findByDocumentIdOrderByOrderNum(documentId);

        Map<String, Object> reviewData = new HashMap<>();
        reviewData.put("document", document);
        reviewData.put("sections", sections);
        reviewData.put("reviewReady", true);
        return reviewData;
    }

    /**
     * 提交数据分析任务
     */
    @Transactional
    public DataAnalysisTask submitAnalysis(Long userId, String title, String filePath) {
        DataAnalysisTask task = DataAnalysisTask.builder()
                .userId(userId)
                .title(title)
                .filePath(filePath)
                .status(DataAnalysisTask.TaskStatus.PENDING)
                .build();

        task = dataAnalysisTaskRepository.save(task);
        log.info("用户 {} 提交数据分析任务: id={}, title={}", userId, task.getId(), title);
        return task;
    }

    /**
     * 获取数据分析结果
     */
    @Transactional(readOnly = true)
    public DataAnalysisTask getAnalysisResult(Long taskId) {
        return dataAnalysisTaskRepository.findById(taskId)
                .orElseThrow(() -> new BusinessException("分析任务不存在", HttpStatus.NOT_FOUND));
    }

    /**
     * 获取用户的分析任务列表
     */
    @Transactional(readOnly = true)
    public List<DataAnalysisTask> getAnalysisTasks(Long userId) {
        return dataAnalysisTaskRepository.findByUserId(userId);
    }
}
