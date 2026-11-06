package org.example.myselfblog.Comment.Service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.Comment.eneity.Comment;
import org.example.myselfblog.Comment.request.CreateCommentRequest;
import org.example.myselfblog.user.entity.User;

public interface CommentService {
    boolean addComment(Long essayId, CreateCommentRequest request, User user);
    Page<Comment> getComments(Long essayId,Long pageNum, Long pageSize);
    boolean deleteComment(Long commentId, User user);
}
