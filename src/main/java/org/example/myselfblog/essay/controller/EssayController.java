package org.example.myselfblog.essay.controller;


import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import org.example.myselfblog.common.exception.BusinessException;
import org.example.myselfblog.common.response.Result;
import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.mapper.EssayLikeMapper;
import org.example.myselfblog.essay.mapper.EssayMapper;
import org.example.myselfblog.essay.request.CreateEssayRequest;
import org.example.myselfblog.user.entity.User;
import org.example.myselfblog.user.mapper.UserMapper;
import org.example.myselfblog.essay.service.EssayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/essay")
public class EssayController {
    @Autowired
    private EssayService essayService;
    @Autowired
    private UserMapper userMapper;

    @PostMapping("/add")
    public Result<Void> addEssay(@RequestBody CreateEssayRequest request, @SessionAttribute(name = "loginUserId", required = false) Long userId) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = essayService.addEssay(request, user);
        if (!success) {
            throw new BusinessException(500, "文章发布失败，请稍后重试");
        }
        return new Result<>(true, "文章发布成功", null);
    }

    @PostMapping("/update/{id}")
    public Result<Void> updateEssay(@SessionAttribute(name = "loginUserId", required = false) Long userId, @RequestBody Essay essay, @PathVariable Long id) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = essayService.updateEssay(id, essay, user);
        if (!success) {
            throw new BusinessException(500, "文章修改失败，请稍后重试");
        }
        return new Result<>(true, "文章修改成功", null);

    }

    @GetMapping("/{id}")
    public Result<Essay> getEssay(@PathVariable Long id, @SessionAttribute(name = "loginUserId", required = false) Long userId) {
        User user = null;
        if (userId != null) {
            user = userMapper.selectById(userId);
        }
        Essay essay = essayService.getEssay(id, user);
        return new Result<>(true, "文章查询成功", essay);
    }

    @GetMapping("/essays")
    public Result<Page<Essay>> getAllEssay(@RequestParam(name = "pageNum", defaultValue = "1") Long pageNum,
                                           @RequestParam(name = "pageSize", defaultValue = "10") Long pageSize,
                                           @RequestParam(name = "keyword", required = false) String keyword,
                                           @RequestParam(name = "categoryId", required = false) Long categoryId) {
        Page<Essay> essays = essayService.getAllEssay(pageNum, pageSize, keyword, categoryId);
        return new Result<>(true, "文章列表查询成功", essays);
    }

    @PostMapping("/delect/{id}")
    public Result<Void> delectEssay(@SessionAttribute(name = "loginUserId", required = false) Long userId, @PathVariable Long id) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user = userMapper.selectById(userId);
        boolean success = essayService.delectEssay(id, user);
        if (!success) {
            throw new BusinessException(500, "文章删除失败，请稍后重试");
        }
        return new Result<>(true, "文章删除成功", null);
    }

    @PostMapping("/isTop/{id}")
    public Result<Void> isTop(@RequestBody Essay essay, @SessionAttribute(name = "loginUserId", required = false) Long userId,@PathVariable Long id) {
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user=userMapper.selectById(userId);
        boolean success = essayService.isTop(essay,user,id);
        if (!success) {
            throw new BusinessException(500, "文章置顶失败，请稍后重试");
        }
        return new Result<>(true, "文章置顶成功", null);
    }

    @PostMapping("/like/{essayId}")
    public Result<Void> likeEssay(
            @PathVariable("essayId") Long essayId,
            @SessionAttribute(name = "loginUserId", required = false) Long userId){
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user=userMapper.selectById(userId);
        boolean success=essayService.likeEssay(essayId,user);
        if (!success) {
            throw new BusinessException(500, "点赞失败，请稍后重试");
        }
        return new Result<>(true, "点赞成功", null);
    }

    @DeleteMapping("/like/{essayId}")
    public Result<Void> delete(@PathVariable Long essayId,
                               @SessionAttribute(name = "loginUserId",required = false)Long userId){
        if (userId == null) {
            throw new BusinessException(401, "请先登录");
        }
        User user=userMapper.selectById(userId);
        boolean success=essayService.unlikeEssay(essayId,user);
        if (!success) {
            throw new BusinessException(500, "取消点赞失败，请稍后重试");
        }
        return new Result<>(true, "取消点赞成功", null);
    }

    @GetMapping("/front/{id}")
    public Result<Essay> getFrontEssay(@PathVariable Long id){
        Essay essay = essayService.getFrontEssay(id);
        String message = essay == null ? "已经是最早发布的文章了" : "上一篇查询成功";
        return new Result<>(true, message, essay);
    }
    @GetMapping("/under/{id}")
    public Result<Essay> getUnderEssay(@PathVariable Long id){
        Essay essay = essayService.getUnderEssay(id);
        String message = essay == null ? "已经是最晚发布的文章了" : "下一篇查询成功";
        return new Result<>(true, message, essay);
    }



}
