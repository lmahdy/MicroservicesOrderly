package com.orderly.product.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {

    @GetMapping("/")
    public Map<String, Object> root() {
        return Map.of(
                "application", "product-service",
                "status", "UP",
                "api", "/api/products",
                "swagger", "/swagger-ui.html"
        );
    }
}
