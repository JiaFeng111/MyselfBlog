package org.example.myselfblog.essay.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import org.example.myselfblog.category.mapper.CategoryMapper;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.essay.request.CreateDraftRequest;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.essay.service.DraftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DraftImpl implements DraftService {
    @Autowired
    private EssayMapper essayMapper;
    @Autowired
    private CategoryMapper categoryMapper;

    @Override
    public List<Essay> getAllDraft(User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以查看草稿列表");
        }
        LambdaQueryWrapper<Essay> Wrapper = new LambdaQueryWrapper<>();
        Wrapper.eq(Essay::getStatus, 0);
        Wrapper.orderByDesc(Essay::getId);
        return essayMapper.selectList(Wrapper);
    }

    @Override
    @Transactional
    public boolean updateDraft(Long id, Essay essay, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以修改草稿");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "草稿ID必须为正整数");
        }
        if (essay == null) {
            throw new BusinessException(400, "草稿请求内容不能为空");
        }
        String summary=essay.getSummary();
        String coverUrl=essay.getCoverUrl();
        if(summary!=null&&summary.length()>200){
            throw new BusinessException(400, "摘要不能超过200个字符");
        }
        if(coverUrl!=null&&coverUrl.length()>500){
            throw new BusinessException(400, "封面地址不能超过500个字符");
        }
        Long categoryId = essay.getCategoryId();
        validateCategoryId(categoryId);
        String title = essay.getTitle() == null ? "" : essay.getTitle();
        if (title.length() > 120) {
            throw new BusinessException(400, "草稿标题不能超过120个字符");
        }
        essay.setTitle(title.isBlank() ? "" : title);
        String essayContent = essay.getEssay() == null ? "" : essay.getEssay();
        essay.setEssay(essayContent.isBlank() ? "" : essayContent);

        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getStatus, 0);
        wrapper.eq(Essay::getId, id);
        wrapper.set(Essay::getEssay, essay.getEssay());
        wrapper.set(Essay::getCoverUrl,essay.getCoverUrl());
        wrapper.set(Essay::getSummary,essay.getSummary());
        wrapper.set(Essay::getCategoryId, categoryId);
        wrapper.set(Essay::getTitle, essay.getTitle());
        int rows = essayMapper.update(null, wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "草稿不存在或已不是草稿");
        }
        return true;
    }

    @Override
    public Long addDraft(CreateDraftRequest request, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以创建草稿");
        }
        if (request == null) {
            throw new BusinessException(400, "草稿请求内容不能为空");
        }
        String summary=request.getSummary();
        String coverUrl=request.getCoverUrl();
        if(summary!=null&&summary.length()>200){
            throw new BusinessException(400, "摘要不能超过200个字符");
        }
        if(coverUrl!=null&&coverUrl.length()>500){
            throw new BusinessException(400, "封面地址不能超过500个字符");
        }
        Long categoryId = request.getCategoryId();
        validateCategoryId(categoryId);
        String title = request.getTitle() == null ? "" : request.getTitle();
        if (title.length() > 120) {
            throw new BusinessException(400, "草稿标题不能超过120个字符");
        }
        Essay essay = new Essay();
        essay.setTitle(title.isBlank() ? "" : title);
        essay.setCategoryId(categoryId);
        essay.setSummary(request.getSummary());
        essay.setCoverUrl(request.getCoverUrl());
        String essayContent = request.getEssay() == null ? "" : request.getEssay();
        essay.setEssay(essayContent.isBlank() ? "" : essayContent);
        essay.setStatus(0);
        int rows = essayMapper.insert(essay);
        if (rows <= 0) {
            throw new BusinessException(500, "草稿保存失败，请稍后重试");
        }
        return essay.getId();
    }


    @Override
    public boolean delectDraft(Long id, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以删除草稿");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "草稿ID必须为正整数");
        }

        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, id);
        wrapper.eq(Essay::getStatus, 0);
        int rows = essayMapper.delete(wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "已发布草稿不存在或状态已变更");
        }
        return true;
    }

    @Override
    @Transactional
    public boolean ToEssay(Long id, User user) {
        if (user == null) {
            throw new BusinessException(401, "请先登录");
        }
        if (!"1".equals(user.getAccess())) {
            throw new BusinessException(403, "只有管理员可以修改草稿");
        }
        if (id == null || id <= 0) {
            throw new BusinessException(400, "草稿ID必须为正整数");
        }

        LambdaQueryWrapper<Essay> query = new LambdaQueryWrapper<>();
        query.eq(Essay::getId, id).eq(Essay::getStatus, 0);
        query.last("FOR UPDATE");
        Essay essay = essayMapper.selectOne(query);
        if(essay==null){
            throw new BusinessException(404, "已发布草稿不存在或状态已变更");
        }
        validateCategoryId(essay.getCategoryId());
        if (essay.getTitle() == null || essay.getEssay() == null || essay.getEssay().isBlank() || essay.getTitle().isBlank()) {
            throw new BusinessException(400, "草稿请求内容不能为空");
        }
        String title = essay.getTitle() == null ? "" : essay.getTitle();
        if (title.length() > 120) {
            throw new BusinessException(400, "草稿标题不能超过120个字符");
        }
        LambdaUpdateWrapper<Essay> wrapper = new LambdaUpdateWrapper<>();
        wrapper.eq(Essay::getId, id);
        wrapper.eq(Essay::getStatus, 0);
        wrapper.set(Essay::getStatus, 1);
        wrapper.set(Essay::getPublishTime, LocalDateTime.now());
        int rows = essayMapper.update(wrapper);
        if (rows <= 0) {
            throw new BusinessException(404, "已发布草稿不存在或状态已变更");
        }
        return true;
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

}
