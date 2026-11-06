package org.example.myselfblog.essay.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.common.exception.AllExceptionHandler;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.essay.request.CreateEssayRequest;
import org.example.myselfblog.essay.service.EssayService;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class EssayControllerTest {

    @Mock
    private EssayService essayService;
    @Mock
    private EssayMapper essayMapper;
    @Mock
    private UserMapper userMapper;
    @InjectMocks
    private EssayController controller;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        // 使用真实的参数绑定和异常处理，Service、Mapper 则使用测试替身。
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new AllExceptionHandler())
                .build();
    }

    @Test
    void publishesForLoggedInUserAndReturnsUnifiedResponse() throws Exception {
        User user = new User();
        user.setId(1L);
        when(userMapper.selectById(1L)).thenReturn(user);
        when(essayService.addEssay(any(CreateEssayRequest.class), eq(user))).thenReturn(true);

        mockMvc.perform(post("/essay/add")
                        .sessionAttr("loginUserId", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"Spring Boot", "essay":"正文"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("文章发布成功"));

        CreateEssayRequest expected = new CreateEssayRequest();
        expected.setTitle("Spring Boot");
        expected.setEssay("正文");
        verify(essayService).addEssay(expected, user);
        verifyNoInteractions(essayMapper);
    }

    @Test
    void rejectsPublishingWithoutLogin() throws Exception {
        mockMvc.perform(post("/essay/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"标题\",\"essay\":\"正文\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("请先登录"));

        verifyNoInteractions(essayService, essayMapper, userMapper);
    }

    @Test
    void translatesFailedPublishResultToServerError() throws Exception {
        User user = new User();
        when(userMapper.selectById(1L)).thenReturn(user);
        when(essayService.addEssay(any(CreateEssayRequest.class), eq(user))).thenReturn(false);

        mockMvc.perform(post("/essay/add")
                        .sessionAttr("loginUserId", 1L)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"标题\",\"essay\":\"正文\"}"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("文章发布失败，请稍后重试"));
    }

    @Test
    void delegatesGuestDetailQueryToService() throws Exception {
        Essay essay = new Essay();
        essay.setId(7L);
        essay.setTitle("文章标题");
        when(essayService.getEssay(7L, null)).thenReturn(essay);

        mockMvc.perform(get("/essay/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(7))
                .andExpect(jsonPath("$.data.title").value("文章标题"));

        verify(essayService).getEssay(7L, null);
        verifyNoInteractions(essayMapper, userMapper);
    }

    @Test
    void suppliesLoggedInUserToDetailQuery() throws Exception {
        User user = new User();
        when(userMapper.selectById(1L)).thenReturn(user);
        when(essayService.getEssay(7L, user)).thenReturn(new Essay());

        mockMvc.perform(get("/essay/7").sessionAttr("loginUserId", 1L))
                .andExpect(status().isOk());

        verify(essayService).getEssay(7L, user);
    }

    @Test
    void defaultsToFirstPageOfTenWithoutLogin() throws Exception {
        when(essayService.getAllEssay(1L, 10L)).thenReturn(new Page<>(1, 10, 0));

        mockMvc.perform(get("/essay/essays"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.current").value(1))
                .andExpect(jsonPath("$.data.size").value(10))
                .andExpect(jsonPath("$.data.total").value(0))
                .andExpect(jsonPath("$.data.records").isEmpty());

        verify(essayService).getAllEssay(1L, 10L);
        verifyNoInteractions(essayMapper, userMapper);
    }

    @Test
    void returnsRequestedPageAndItsMetadata() throws Exception {
        Essay essay = new Essay();
        essay.setId(3L);
        essay.setTitle("第三篇文章");
        Page<Essay> page = new Page<>(2, 2, 3);
        page.setRecords(List.of(essay));
        when(essayService.getAllEssay(2L, 2L)).thenReturn(page);

        mockMvc.perform(get("/essay/essays").param("pageNum", "2").param("pageSize", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.current").value(2))
                .andExpect(jsonPath("$.data.size").value(2))
                .andExpect(jsonPath("$.data.total").value(3))
                .andExpect(jsonPath("$.data.pages").value(2))
                .andExpect(jsonPath("$.data.records.length()").value(1))
                .andExpect(jsonPath("$.data.records[0].id").value(3));

        verify(essayService).getAllEssay(2L, 2L);
    }

    @ParameterizedTest
    @ValueSource(strings = {"pageNum", "pageSize"})
    void rejectsNonNumericPaginationParameters(String parameter) throws Exception {
        mockMvc.perform(get("/essay/essays").param(parameter, "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("参数 " + parameter + " 类型不正确"));

        verifyNoInteractions(essayService, essayMapper, userMapper);
    }

    @Test
    void preservesPaginationBusinessErrorStatusAndMessage() throws Exception {
        when(essayService.getAllEssay(0L, 10L))
                .thenThrow(new BusinessException(400, "页码必须大于等于1！"));

        mockMvc.perform(get("/essay/essays").param("pageNum", "0"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("页码必须大于等于1！"));
    }
}
