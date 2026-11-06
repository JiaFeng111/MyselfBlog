package org.example.myselfblog.essay.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.myselfblog.essay.entity.Essay;

@Mapper
public interface EssayMapper extends BaseMapper<Essay> {}

