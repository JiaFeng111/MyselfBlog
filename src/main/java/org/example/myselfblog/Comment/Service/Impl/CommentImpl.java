package org.example.myselfblog.Comment.Service.Impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.Comment.Service.CommentService;
import org.example.myselfblog.Comment.eneity.Comment;
import org.example.myselfblog.Comment.mapper.CommentMapper;
import org.example.myselfblog.Comment.request.CreateCommentRequest;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Objects;


@Service
public class CommentImpl implements CommentService {
    @Autowired
    private CommentMapper commentMapper;
    @Autowired
    private EssayMapper essayMapper;

    @Override
    public boolean addComment(Long essayId, CreateCommentRequest request, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (essayId == null || essayId <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        if (request == null || request.getContent() == null || request.getContent().isBlank() || request.getContent().length() > 1000) {
            throw new BusinessException(400, "不能评论空白内容，评论不能超过1000个字符");
        }
        Essay essay = essayMapper.selectById(essayId);
        if (essay == null) {
            throw new BusinessException(404, "文章不存在");
        }
        if (!Integer.valueOf(1).equals(essay.getStatus())) {
            throw new BusinessException(400, "只能评论已发布的文章");
        }
        Comment comment = new Comment();
        comment.setEssayId(essayId);
        comment.setUserId(user.getId());
        comment.setContent(request.getContent());
        comment.setStatus(1);
        return commentMapper.insert(comment) > 0;
    }

    @Override
    public Page<Comment> getComments(Long essayId, Long pageNum, Long pageSize) {
        if (essayId == null || essayId <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        if (pageNum == null || pageNum < 1) {
            throw new BusinessException(400, "页码必须大于等于1！");
        }
        if (pageSize == null || pageSize < 1 || pageSize > 50) {
            throw new BusinessException(400, "每页条数必须在1到50之间");
        }
        Essay essay = essayMapper.selectById(essayId);
        if (essay == null) {
            throw new BusinessException(404, "文章不存在");
        }
        if (!Integer.valueOf(1).equals(essay.getStatus())) {
            throw new BusinessException(400, "只能评论已发布的文章");
        }
        LambdaQueryWrapper<Comment> query = new LambdaQueryWrapper<>();
        query.orderByDesc(Comment::getId);
        Page<Comment> page = new Page<>(pageNum, pageSize);
        query.eq(Comment::getEssayId, essayId);
        query.eq(Comment::getStatus, 1);
        query.select(Comment::getId, Comment::getUserId, Comment::getContent, Comment::getCreateTime);
        return commentMapper.selectPage(page, query);

    }

    @Override
    public boolean deleteComment(Long commentId, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (commentId == null || commentId <= 0) {
            throw new BusinessException(400, "评论ID必须为正整数");
        }
        Comment comment = commentMapper.selectById(commentId);
        if (comment == null) {
            throw new BusinessException(404, "评论不存在或已删除");
        }
        boolean isAdmin = "1".equals(user.getAccess());
        boolean isOwner = Objects.equals(comment.getUserId(), user.getId());
        if (!isAdmin && !isOwner) {
            throw new BusinessException(403, "只能删除自己的评论");
        }
        int rows = commentMapper.deleteById(commentId);
        if (rows <= 0) {
            throw new BusinessException(404, "评论不存在或已删除");
        }
        return true;
    }
}
