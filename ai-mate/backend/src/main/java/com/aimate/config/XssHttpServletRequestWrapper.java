package com.aimate.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import org.springframework.web.util.HtmlUtils;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

/**
 * XSS 请求包装器：对所有请求参数进行 HTML 转义
 */
public class XssHttpServletRequestWrapper extends HttpServletRequestWrapper {

    public XssHttpServletRequestWrapper(HttpServletRequest request) {
        super(request);
    }

    @Override
    public String getParameter(String name) {
        String value = super.getParameter(name);
        return cleanXss(value);
    }

    @Override
    public String[] getParameterValues(String name) {
        String[] values = super.getParameterValues(name);
        if (values == null) {
            return null;
        }
        String[] cleanValues = new String[values.length];
        for (int i = 0; i < values.length; i++) {
            cleanValues[i] = cleanXss(values[i]);
        }
        return cleanValues;
    }

    @Override
    public Map<String, String[]> getParameterMap() {
        Map<String, String[]> originalMap = super.getParameterMap();
        Map<String, String[]> cleanMap = new HashMap<>();
        for (Map.Entry<String, String[]> entry : originalMap.entrySet()) {
            String[] values = entry.getValue();
            String[] cleanValues = new String[values.length];
            for (int i = 0; i < values.length; i++) {
                cleanValues[i] = cleanXss(values[i]);
            }
            cleanMap.put(entry.getKey(), cleanValues);
        }
        return cleanMap;
    }

    @Override
    public String getHeader(String name) {
        String value = super.getHeader(name);
        return cleanXss(value);
    }

    private String cleanXss(String value) {
        if (value == null) {
            return null;
        }
        return HtmlUtils.htmlEscape(value);
    }
}
