package org.example.myselfblog.essay.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.request.CreateEssayRequest;
import org.example.myselfblog.user.entity.User;

import java.util.List;

public interface EssayService {
    boolean addEssay(CreateEssayRequest request, User user);

    Essay getEssay(Long id, User user);

    boolean updateEssay(Long id, Essay essay, User user);

    Page<Essay> getAllEssay(Long pageNum,Long pageSize,String keyword,Long categoryId);

    boolean delectEssay(Long id, User user);

    boolean isTop(Essay essay,User user,Long id);

    boolean likeEssay(Long essayId, User user);

    boolean unlikeEssay(Long essayId, User user);

    Essay getFrontEssay(Long id);

    Essay getUnderEssay(Long id);
}
