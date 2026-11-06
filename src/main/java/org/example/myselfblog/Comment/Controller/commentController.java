package org.example.myselfblog.Comment.Controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.Comment.Service.CommentService;
import org.example.myselfblog.Comment.eneity.Comment;
import org.example.myselfblog.Comment.mapper.CommentMapper;
import org.example.myselfblog.Comment.request.CreateCommentRequest;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.common.response.Result;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/comment")
public class commentController {
    @Autowired
    private CommentService commentService;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private EssayMapper essayMapper;
    @Autowired
    private CommentMapper commentMapper;

    @PostMapping("/add/{essayId}")
    public Result<Void> addComment(@SessionAttribute(name = "loginUserId", required = false) Long userId, @RequestBody CreateCommentRequest request, @PathVariable Long essayId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = commentService.addComment(essayId, request, user);
        if (!success) {
            throw new BusinessException(500, "评论发布失败，请稍后重试");
        }
        return new Result<>(true, "成功评论！", null);
    }

    @GetMapping("/comments/{essayId}")
    public Result<Page<Comment>> getAllEssay(@RequestParam(name = "pageNum", defaultValue = "1") Long pageNum,
                                             @RequestParam(name = "pageSize", defaultValue = "10") Long pageSize,
                                             @PathVariable Long essayId) {
        Page<Comment> comments = commentService.getComments(essayId, pageNum, pageSize);
        return new Result<>(true, "文章列表查询成功", comments);
    }

    @PostMapping("/delect/{commentId}")
    public Result<Void> delectEssay(@SessionAttribute(name = "loginUserId", required = false) Long userId, @PathVariable Long commentId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = commentService.deleteComment(commentId, user);
        if (!success) {
            throw new BusinessException(500, "评论删除失败，请稍后重试");
        }
        return new Result<>(true, "评论删除成功", null);
    }
}
