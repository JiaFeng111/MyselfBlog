package org.example.myselfblog.essay.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.category.mapper.CategoryMapper;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.entity.EssayLike;
import org.example.myselfblog.essay.mapper.EssayLikeMapper;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.essay.request.CreateEssayRequest;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.essay.service.EssayService;
import org.example.myselfblog.user.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Service
public class EssayImpl implements EssayService {
    @Autowired
    private EssayMapper essayMapper;
    @Autowired
    private CategoryMapper categoryMapper;
    @Autowired
    private EssayLikeMapper essayLikeMapper;
    @Autowired
    private UserMapper userMapper;

    @Override
    public boolean addEssay(CreateEssayRequest request, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以发布文章");
        }
        if (request == null || request.getTitle() == null || request.getEssay() == null || request.getEssay().isBlank() || request.getTitle().isBlank() || request.getTitle().length() > 120) {
            throw new BusinessException(400, "文章标题和正文不能为空白，标题不能超过120个字符");
        }
        String summary = request.getSummary();
        String coverUrl = request.getCoverUrl();
        if (summary != null && summary.length() > 200) {
            throw new BusinessException(400, "摘要不能超过200个字符");
        }
        if (coverUrl != null && coverUrl.length() > 500) {
            throw new BusinessException(400, "封面地址不能超过500个字符");
        }
        Long categoryId = request.getCategoryId();
        validateCategoryId(categoryId);
        Essay essay = new Essay();
        essay.setEssay(request.getEssay());
        essay.setTitle(request.getTitle());
        essay.setCoverUrl(request.getCoverUrl());
        essay.setSummary(request.getSummary());
        essay.setCategoryId(categoryId);
        if (CheckEssay(essay)) {
            essay.setStatus(1);
            essay.setPublishTime(LocalDateTime.now());
            int rows = essayMapper.insert(essay);
            if (rows <= 0) {
                throw new BusinessException(500, "文章发布失败，请稍后重试");
            }
            return true;
        }
        throw new BusinessException(400, "文章标题和正文不能为空白");
    }

    @Override
    public Essay getEssay(Long id, User user) {
        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        Essay essay = essayMapper.selectById(id);
        if (essay == null) {
            throw new BusinessException(404, "文章不存在");
        }
        if (Integer.valueOf(1).equals(essay.getStatus())) {
            LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
            wrapper.eq(Essay::getId, id).eq(Essay::getStatus, 1).setIncrBy(Essay::getViewCount, 1);
            int rows = essayMapper.update(wrapper);
            if (rows <= 0) {
                throw new BusinessException(404, "文章不存在或当前不可访问");
            }
            essay.setViewCount(essay.getViewCount() + 1);
            return essay;
        }

        if (Integer.valueOf(0).equals(essay.getStatus())) {
            if (user == null) {
                throw new BusinessException(401, "请先登录后查看草稿");
            }
            if (!"1".equals(user.getAccess())) {
                throw new BusinessException(403, "只有管理员可以查看草稿");
            }

            return essay;
        }
        throw new BusinessException(404, "文章不存在或当前不可访问");
    }

    @Override
    public boolean updateEssay(Long id, Essay essay, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以修改文章");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        if (essay == null) {
            throw new BusinessException(400, "文章请求内容不能为空");
        }
        if (essay.getTitle() == null || essay.getEssay() == null || essay.getEssay().isBlank() || essay.getTitle().isBlank() || essay.getTitle().length() > 120) {
            throw new BusinessException(400, "文章标题和正文不能为空白，标题不能超过120个字符");
        }

        Essay existing = essayMapper.selectById(id);
        if (existing == null || !Integer.valueOf(1).equals(existing.getStatus())) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        String summary = essay.getSummary();
        String coverUrl = essay.getCoverUrl();
        if (summary != null && summary.length() > 200) {
            throw new BusinessException(400, "摘要不能超过200个字符");
        }
        if (coverUrl != null && coverUrl.length() > 500) {
            throw new BusinessException(400, "封面地址不能超过500个字符");
        }
        Long categoryId = essay.getCategoryId();
        validateCategoryId(categoryId);
        if (Objects.equals(existing.getTitle(), essay.getTitle())
                && Objects.equals(existing.getEssay(), essay.getEssay())
                && Objects.equals(existing.getCategoryId(), categoryId)
                && Objects.equals(existing.getCoverUrl(), essay.getCoverUrl())
                && Objects.equals(existing.getSummary(), essay.getSummary())) {
            return true;
        }
        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, id);
        wrapper.eq(Essay::getStatus, 1);
        wrapper.set(Essay::getTitle, essay.getTitle());
        wrapper.set(Essay::getCoverUrl, essay.getCoverUrl());
        wrapper.set(Essay::getSummary, essay.getSummary());
        wrapper.set(Essay::getEssay, essay.getEssay());
        wrapper.set(Essay::getCategoryId, categoryId);
        int rows = essayMapper.update(null, wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        return true;
    }

    @Override
    public Page<Essay> getAllEssay(Long pageNum, Long pageSize, String keyword, Long categoryId) {
        if (pageNum == null || pageNum < 1) {
            throw new BusinessException(400, "页码必须大于等于1！");
        }
        if (pageSize == null || pageSize < 1 || pageSize > 50) {
            throw new BusinessException(400, "每页条数必须在1到50之间");
        }
        validateCategoryId(categoryId);
        LambdaQueryWrapper<Essay> Wrapper = new LambdaQueryWrapper<>();
        if (categoryId != null) {
            Wrapper.eq(Essay::getCategoryId, categoryId);
        }

        Wrapper.eq(Essay::getStatus, 1);
        if (keyword != null && !keyword.isBlank()) {
            String searchWord = keyword.trim();
            Wrapper.and(w -> w.like(Essay::getTitle, searchWord)
                    .or()
                    .like(Essay::getEssay, searchWord));
        }
        Wrapper.orderByDesc(Essay::getIsTop, Essay::getId);
        Page<Essay> page = new Page<>(pageNum, pageSize);
        Wrapper.select(
                Essay::getId, Essay::getTitle, Essay::getCategoryId,
                Essay::getCoverUrl, Essay::getSummary,
                Essay::getViewCount, Essay::getLikeCount,
                Essay::getAuthor, Essay::getPublishTime,
                Essay::getCreateTime, Essay::getIsTop
        );
        return essayMapper.selectPage(page, Wrapper);
    }

    @Override
    public boolean delectEssay(Long id, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以删除文章");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }

        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, id);
        wrapper.eq(Essay::getStatus, 1);
        int rows = essayMapper.delete(wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        return true;
    }

    @Override
    public boolean isTop(Essay essay, User user, Long id) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以修改文章");
        }

        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        if (essay == null) {
            throw new BusinessException(400, "文章请求内容不能为空");
        }
        if (!Integer.valueOf(0).equals(essay.getIsTop()) &&
                !Integer.valueOf(1).equals(essay.getIsTop())) {
            throw new BusinessException(400, "置顶失败");
        }

        Essay existing = essayMapper.selectById(id);
        if (existing == null || !Integer.valueOf(1).equals(existing.getStatus())) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        if (Objects.equals(existing.getIsTop(), essay.getIsTop())) {
            return true;
        }
        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, id);
        wrapper.eq(Essay::getStatus, 1);
        wrapper.set(Essay::getIsTop, essay.getIsTop());
        int rows = essayMapper.update(null, wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        return true;
    }

    @Override
    @Transactional
    public boolean likeEssay(Long essayId, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (essayId == null || essayId <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        Essay essay = essayMapper.selectById(essayId);
        if (essay == null || !Integer.valueOf(1).equals(essay.getStatus())) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        EssayLike essayLike = new EssayLike();
        essayLike.setEssayId(essayId);
        essayLike.setUserId(user.getId());
        try {
            int rows = essayLikeMapper.insert(essayLike);
            if (rows != 1) {
                throw new BusinessException(500, "点赞失败，稍后重试");
            }
        } catch (DuplicateKeyException e) {
            throw new BusinessException(409, "你已经给这篇文章点过赞了");
        }
        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, essayId).eq(Essay::getStatus, 1)
                .setIncrBy(Essay::getLikeCount, 1);
        int updateRows = essayMapper.update(wrapper);
        if (updateRows != 1) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        return true;
    }

    @Override
    @Transactional
    public boolean unlikeEssay(Long essayId, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (essayId == null || essayId <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        Essay essay = essayMapper.selectById(essayId);
        if (essay == null || !Integer.valueOf(1).equals(essay.getStatus())) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        LambdaQueryWrapper<EssayLike> deleteWrapper = new LambdaQueryWrapper<>();
        deleteWrapper.eq(EssayLike::getEssayId, essayId).eq(EssayLike::getUserId, user.getId());
        int deleteRows = essayLikeMapper.delete(deleteWrapper);
        if (deleteRows == 0) {
            return true;
        }
        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, essayId)
                .eq(Essay::getStatus, 1)
                .gt(Essay::getLikeCount, 0)
                .setDecrBy(Essay::getLikeCount, 1);
        int rows = essayMapper.update(wrapper);
        if (rows != 1) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        return true;
    }

    @Override
    public Essay getFrontEssay(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        Essay essay=essayMapper.selectById(id);
        if (essay == null || !Integer.valueOf(1).equals(essay.getStatus())) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        LocalDateTime time=essay.getPublishTime();
        if (time == null) {
            throw new BusinessException(500, "文章发布时间缺失，请联系管理员");
        }
        LambdaQueryWrapper<Essay> query=new LambdaQueryWrapper<>();
        query.eq(Essay::getStatus,1);
        query.and(w->w.lt(Essay::getPublishTime,time)
                .or(v->v.eq(Essay::getPublishTime,time)
                        .lt(Essay::getId,id)));
        query.orderByDesc(Essay::getPublishTime,Essay::getId);
        query.last("LIMIT 1");
        return essayMapper.selectOne(query);
    }

    @Override
    public Essay getUnderEssay(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(400, "文章ID必须为正整数");
        }
        Essay essay=essayMapper.selectById(id);
        if (essay == null || !Integer.valueOf(1).equals(essay.getStatus())) {
            throw new BusinessException(404, "已发布文章不存在或状态已变更");
        }
        LocalDateTime time=essay.getPublishTime();
        if (time == null) {
            throw new BusinessException(500, "文章发布时间缺失，请联系管理员");
        }
        LambdaQueryWrapper<Essay> query=new LambdaQueryWrapper<>();
        query.eq(Essay::getStatus,1);
        query.and(w->w.gt(Essay::getPublishTime,time)
                .or(v->v.eq(Essay::getPublishTime,time)
                        .gt(Essay::getId,id)));
        query.orderByAsc(Essay::getPublishTime,Essay::getId);
        query.last("LIMIT 1");
        return essayMapper.selectOne(query);
    }


    private void validateCategoryId(Long categoryId) {
        if (categoryId == null) {
            return;
        }
        if (categoryId <= 0) {
            throw new BusinessException(400, "分类ID必须为正整数");
        }
        if (categoryMapper.selectById(categoryId) == null) {
            throw new BusinessException(404, "所选分类不存在");
        }
    }

    public boolean CheckEssay(Essay essay) {
        if (essay == null || essay.getTitle() == null || essay.getEssay() == null || essay.getEssay().isBlank() || essay.getTitle().isBlank()) {
            return false;
        }
        return true;
    }
}


