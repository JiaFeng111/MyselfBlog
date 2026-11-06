package org.example.myselfblog.essay.service;

import org.example.myselfblog.essay.entity.Essay;
import org.example.myselfblog.essay.request.CreateDraftRequest;
import org.example.myselfblog.user.entity.User;

import java.util.List;

public interface DraftService {
    List<Essay> getAllDraft(User user);

    boolean updateDraft(Long id, Essay essay, User user);

    Long addDraft(CreateDraftRequest request, User user);

    boolean delectDraft(Long id, User user);

    boolean ToEssay(Long id, User user);
}
