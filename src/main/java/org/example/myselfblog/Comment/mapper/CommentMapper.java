package org.example.myselfblog.Comment.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.myselfblog.Comment.eneity.Comment;

@Mapper
public interface CommentMapper extends BaseMapper<Comment> {
}
