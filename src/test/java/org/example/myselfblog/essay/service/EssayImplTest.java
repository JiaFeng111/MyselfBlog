package org.example.myselfblog.essay.service;

import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.essay.request.CreateEssayRequest;
import org.example.myselfblog.essay.service.impl.EssayImpl;
import org.example.myselfblog.user.entity.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EssayImplTest {

    @Mock
    private EssayMapper essayMapper;
    @InjectMocks
    private EssayImpl service;

    @Test
    void publishesRequestContentWithPublishedStatus() {
        when(essayMapper.insert(any(Essay.class))).thenReturn(1);

        assertTrue(service.addEssay(validRequest(), admin()));

        ArgumentCaptor<Essay> savedEssay = ArgumentCaptor.forClass(Essay.class);
        verify(essayMapper).insert(savedEssay.capture());
        assertEquals("文章标题", savedEssay.getValue().getTitle());
        assertEquals("文章正文", savedEssay.getValue().getEssay());
        assertEquals(Integer.valueOf(1), savedEssay.getValue().getStatus());
    }

    @Test
    void throwsBusinessExceptionWhenInsertAffectsNoRows() {
        when(essayMapper.insert(any(Essay.class))).thenReturn(0);

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.addEssay(validRequest(), admin()));

        assertEquals(500, exception.getStatus());
        assertEquals("文章发布失败，请稍后重试", exception.getMessage());
    }

    @Test
    void rejectsPublishingWithoutLoginBeforeAccessingDatabase() {
        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.addEssay(validRequest(), null));

        assertEquals(401, exception.getStatus());
        verifyNoInteractions(essayMapper);
    }

    @Test
    void rejectsPublishingByOrdinaryUserBeforeAccessingDatabase() {
        User user = new User();
        user.setAccess("0");

        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.addEssay(validRequest(), user));

        assertEquals(403, exception.getStatus());
        verifyNoInteractions(essayMapper);
    }

    @ParameterizedTest
    @MethodSource("invalidPagination")
    void rejectsInvalidPaginationBeforeAccessingDatabase(Long pageNum, Long pageSize,
                                                       String expectedMessage) {
        BusinessException exception = assertThrows(BusinessException.class,
                () -> service.getAllEssay(pageNum, pageSize));

        assertEquals(400, exception.getStatus());
        assertEquals(expectedMessage, exception.getMessage());
        verifyNoInteractions(essayMapper);
    }

    static Stream<Arguments> invalidPagination() {
        return Stream.of(
                Arguments.of(null, 10L, "页码必须大于等于1！"),
                Arguments.of(0L, 10L, "页码必须大于等于1！"),
                Arguments.of(-1L, 10L, "页码必须大于等于1！"),
                Arguments.of(1L, null, "每页条数必须在1到50之间"),
                Arguments.of(1L, 0L, "每页条数必须在1到50之间"),
                Arguments.of(1L, -1L, "每页条数必须在1到50之间"),
                Arguments.of(1L, 51L, "每页条数必须在1到50之间")
        );
    }

    private CreateEssayRequest validRequest() {
        CreateEssayRequest request = new CreateEssayRequest();
        request.setTitle("文章标题");
        request.setEssay("文章正文");
        return request;
    }

    private User admin() {
        User user = new User();
        user.setId(1L);
        user.setAccess("1");
        return user;
    }
}
