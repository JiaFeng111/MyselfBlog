package org.example.myselfblog.essay.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Update;
import org.example.myselfblog.essay.entity.EssayLike;

@Mapper
public interface EssayLikeMapper extends BaseMapper<EssayLike> {

}
