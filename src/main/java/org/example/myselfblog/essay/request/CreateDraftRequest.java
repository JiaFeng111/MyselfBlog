package org.example.myselfblog.essay.request;

import lombok.Data;

@Data
public class CreateDraftRequest {
    private String title;
    private String essay;
    private Long categoryId;
    private String coverUrl;
    private String summary;
}
