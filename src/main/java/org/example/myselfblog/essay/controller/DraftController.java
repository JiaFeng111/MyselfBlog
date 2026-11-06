package org.example.myselfblog.essay.controller;

import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.common.response.Result;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.essay.request.CreateDraftRequest;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.example.myselfblog.essay.service.DraftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/draft")
public class DraftController {
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private DraftService draftService;
    @Autowired
    private EssayMapper essayMapper;
    @PostMapping("/add")
    public Result<Long> addDraft(@RequestBody CreateDraftRequest request, @SessionAttribute(name = "loginUserId", required = false) Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        Long draftId = draftService.addDraft(request, user);
        if (draftId == null || draftId <= 0) {
            throw new BusinessException(500, "草稿创建失败，请稍后重试");
        }
        return new Result<>(true, "草稿创建成功", draftId);
    }

    @GetMapping("/get")
    public Result<List<Essay>> getAllDraft(@SessionAttribute(name = "loginUserId", required = false) Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        List<Essay> drafts = draftService.getAllDraft(user);
        return new Result<>(true, "草稿列表查询成功", drafts);
    }

    @PutMapping("/update/{id}")
    public Result<Void> updateDraft(
            @PathVariable Long id,
            @RequestBody Essay essay,
            @SessionAttribute(name = "loginUserId", required = false) Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = draftService.updateDraft(id, essay, user);
        if (!success) {
            throw new BusinessException(500, "草稿修改失败，请稍后重试");
        }
        return new Result<>(true, "草稿修改成功", null);
    }
    @PostMapping("/delect/{id}")
    public Result<Void> delectDraft(@SessionAttribute(name = "loginUserId", required = false) Long UserId, @PathVariable Long id) {
        if (UserId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(UserId);
        boolean success = draftService.delectDraft(id, user);
        if (!success) {
            throw new BusinessException(500, "草稿删除失败，请稍后重试");
        }
        return new Result<>(true, "草稿删除成功", null);
    }

    @PostMapping("/ToEssay/{id}")
    public Result<Void> ToEssay(
            @PathVariable Long id,
            @SessionAttribute(name = "loginUserId", required = false) Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = draftService.ToEssay(id, user);
        if (!success) {
            throw new BusinessException(500, "发布失败，请稍后重试");
        }
        return new Result<>(true, "发布成功", null);
    }
}
