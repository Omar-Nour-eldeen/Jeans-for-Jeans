package com.order.order.AOP;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;

@Aspect
@Component
@Slf4j
public class AuditLoggingAspect {

    private static final String LOG_FOLDER = "logs";
    private static final String LOG_FILE = "logs/audit.log";

    @Pointcut("within(@org.springframework.stereotype.Service *)")
    public void serviceLayer() {
    }

    @Around("serviceLayer()")
    public Object logAround(ProceedingJoinPoint jp) throws Throwable {

        long start = System.currentTimeMillis();

        String className = jp.getTarget().getClass().getSimpleName();
        String methodName = jp.getSignature().getName();

        String startTime = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

        try {

            Object result = jp.proceed();

            long executionTime = System.currentTimeMillis() - start;

            String successLog = """

                    ==================================================
                    STATUS        : SUCCESS
                    CLASS         : %s
                    METHOD        : %s
                    EXECUTED_AT   : %s
                    EXECUTION_MS  : %d ms
                    ARGUMENTS     : %s
                    ==================================================
                    """
                    .formatted(
                            className,
                            methodName,
                            startTime,
                            executionTime,
                            Arrays.toString(jp.getArgs()));

            writeLogToFile(successLog);

            log.info(successLog);

            return result;

        } catch (Throwable ex) {

            long executionTime = System.currentTimeMillis() - start;

            String errorLog = """

                    ==================================================
                    STATUS        : FAILED
                    CLASS         : %s
                    METHOD        : %s
                    EXECUTED_AT   : %s
                    EXECUTION_MS  : %d ms
                    EXCEPTION     : %s
                    MESSAGE       : %s
                    ==================================================
                    """
                    .formatted(
                            className,
                            methodName,
                            startTime,
                            executionTime,
                            ex.getClass().getSimpleName(),
                            ex.getMessage());

            writeLogToFile(errorLog);

            log.error(errorLog);

            throw ex;
        }
    }

    private void writeLogToFile(String content) {

        try {

            Path folderPath = Paths.get(LOG_FOLDER);

            if (!Files.exists(folderPath)) {
                Files.createDirectories(folderPath);
            }

            Path filePath = Paths.get(LOG_FILE);

            if (!Files.exists(filePath)) {
                Files.createFile(filePath);
            }

            Files.writeString(
                    filePath,
                    content,
                    StandardOpenOption.APPEND);

        } catch (IOException e) {
            log.error("Failed To Write Log File: {}", e.getMessage());
        }
    }
}

