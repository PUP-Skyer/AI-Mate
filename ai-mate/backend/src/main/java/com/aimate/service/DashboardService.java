package com.aimate.service;

import com.aimate.entity.CommunityPost;
import com.aimate.entity.Conversation;
import com.aimate.entity.Project;
import com.aimate.entity.UsageLog;
import com.aimate.entity.User;
import com.aimate.repository.CommunityPostRepository;
import com.aimate.repository.ConversationRepository;
import com.aimate.repository.ProjectRepository;
import com.aimate.repository.UsageLogRepository;
import com.aimate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final CommunityPostRepository communityPostRepository;
    private final ProjectRepository projectRepository;
    private final UsageLogRepository usageLogRepository;

    /**
     * 获取总览数据：总用户数、总对话数、总帖子数、总项目数
     */
    public Map<String, Long> getOverview() {
        Map<String, Long> overview = new LinkedHashMap<>();
        overview.put("totalUsers", userRepository.count());
        overview.put("totalConversations", conversationRepository.count());
        overview.put("totalPosts", communityPostRepository.count());
        overview.put("totalProjects", projectRepository.count());
        return overview;
    }

    /**
     * 获取最近N天的AI使用统计（按天分组）
     */
    public List<Map<String, Object>> getAIUsageStats(int days) {
        LocalDateTime since = LocalDateTime.of(LocalDate.now().minusDays(days - 1), LocalTime.MIN);
        List<UsageLog> logs = usageLogRepository.findByCreatedAtAfter(since);

        // 按日期分组统计
        Map<String, Long> grouped = logs.stream()
                .collect(Collectors.groupingBy(
                        log -> log.getCreatedAt().toLocalDate().toString(),
                        Collectors.counting()
                ));

        // 填充所有日期（包括没有数据的日期）
        return buildDateSeries(days, grouped);
    }

    /**
     * 获取最近N天的用户增长趋势
     */
    public List<Map<String, Object>> getUserGrowthStats(int days) {
        LocalDateTime since = LocalDateTime.of(LocalDate.now().minusDays(days - 1), LocalTime.MIN);
        List<User> users = userRepository.findByCreatedAtAfter(since);

        // 按日期分组统计
        Map<String, Long> grouped = users.stream()
                .collect(Collectors.groupingBy(
                        user -> user.getCreatedAt().toLocalDate().toString(),
                        Collectors.counting()
                ));

        // 填充所有日期（包括没有数据的日期）
        return buildDateSeries(days, grouped);
    }

    /**
     * 构建日期序列，确保每天都有数据
     */
    private List<Map<String, Object>> buildDateSeries(int days, Map<String, Long> grouped) {
        LocalDate today = LocalDate.now();
        return java.util.stream.IntStream.range(0, days)
                .mapToObj(i -> {
                    LocalDate date = today.minusDays(days - 1 - i);
                    String dateStr = date.toString();
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("date", dateStr);
                    item.put("count", grouped.getOrDefault(dateStr, 0L));
                    return item;
                })
                .collect(Collectors.toList());
    }
}
