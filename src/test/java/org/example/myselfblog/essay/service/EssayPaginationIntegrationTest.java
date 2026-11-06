package org.example.myselfblog.essay.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.essay.entity.Essay;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.LongStream;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class EssayPaginationIntegrationTest {

    @Autowired
    private EssayService essayService;
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void prepareEssays() {
        // 所有写入都发生在 H2 内存库，并在每个测试结束后回滚。
        jdbcTemplate.update("DELETE FROM essay_message");
        List<Object[]> essays = new ArrayList<>();
        for (long id = 1; id <= 55; id++) {
            essays.add(new Object[]{id, "文章" + id, "正文" + id, id <= 53 ? 1 : 0});
        }
        jdbcTemplate.batchUpdate(
                "INSERT INTO essay_message (id, title, essay, status) VALUES (?, ?, ?, ?)", essays);
    }

    @Test
    void paginatesPublishedEssaysInDescendingOrderWithoutDuplicates() {
        Page<Essay> first = essayService.getAllEssay(1L, 10L);
        Page<Essay> second = essayService.getAllEssay(2L, 10L);

        assertThat(first.getTotal()).isEqualTo(53);
        assertThat(first.getPages()).isEqualTo(6);
        assertThat(first.getCurrent()).isEqualTo(1);
        assertThat(first.getRecords()).extracting(Essay::getId)
                .containsExactlyElementsOf(descendingIds(53, 44));
        assertThat(second.getCurrent()).isEqualTo(2);
        assertThat(second.getTotal()).isEqualTo(53);
        assertThat(second.getRecords()).extracting(Essay::getId)
                .containsExactlyElementsOf(descendingIds(43, 34));
        assertThat(first.getRecords()).extracting(Essay::getEssay).containsOnlyNulls();
    }

    @Test
    void returnsOnlyRemainingEssaysOnLastPage() {
        Page<Essay> page = essayService.getAllEssay(6L, 10L);

        assertThat(page.getTotal()).isEqualTo(53);
        assertThat(page.getSize()).isEqualTo(10);
        assertThat(page.getRecords()).extracting(Essay::getId).containsExactly(3L, 2L, 1L);
    }

    @Test
    void returnsEmptyRecordsBeyondLastPageWhilePreservingTotal() {
        Page<Essay> page = essayService.getAllEssay(7L, 10L);

        assertThat(page.getRecords()).isEmpty();
        assertThat(page.getTotal()).isEqualTo(53);
        assertThat(page.getPages()).isEqualTo(6);
        assertThat(page.getCurrent()).isEqualTo(7);
    }

    @Test
    void returnsEmptyPageWhenTableIsEmpty() {
        jdbcTemplate.update("DELETE FROM essay_message");

        Page<Essay> page = essayService.getAllEssay(1L, 10L);

        assertThat(page.getRecords()).isEmpty();
        assertThat(page.getTotal()).isZero();
        assertThat(page.getPages()).isZero();
    }

    @Test
    void returnsEmptyPageWhenOnlyDraftsExist() {
        jdbcTemplate.update("DELETE FROM essay_message WHERE status = 1");

        Page<Essay> page = essayService.getAllEssay(1L, 10L);

        assertThat(page.getRecords()).isEmpty();
        assertThat(page.getTotal()).isZero();
    }

    @Test
    void honorsFiftyPerPageOnBothFirstAndSecondPages() {
        // 防止插件上限变回 20、与 Service 允许的 50 不一致。
        Page<Essay> first = essayService.getAllEssay(1L, 50L);
        Page<Essay> second = essayService.getAllEssay(2L, 50L);

        assertThat(first.getSize()).isEqualTo(50);
        assertThat(first.getTotal()).isEqualTo(53);
        assertThat(first.getPages()).isEqualTo(2);
        assertThat(first.getRecords()).extracting(Essay::getId)
                .containsExactlyElementsOf(descendingIds(53, 4));
        assertThat(second.getSize()).isEqualTo(50);
        assertThat(second.getTotal()).isEqualTo(53);
        assertThat(second.getPages()).isEqualTo(2);
        assertThat(second.getRecords()).extracting(Essay::getId).containsExactly(3L, 2L, 1L);
    }

    private List<Long> descendingIds(long highest, long lowest) {
        return LongStream.rangeClosed(lowest, highest)
                .map(id -> highest + lowest - id)
                .boxed()
                .toList();
    }
}
