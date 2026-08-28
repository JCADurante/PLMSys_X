<?php
declare(strict_types=1);

/**
 * Plate Lifecycle Monitoring System (PLMSys)
 * PHP 8 REST API Router
 */

// Enable CORS for local web development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers/Response.php';
require_once __DIR__ . '/controllers/SetsController.php';
require_once __DIR__ . '/controllers/PositionsController.php';
require_once __DIR__ . '/controllers/PlatesController.php';
require_once __DIR__ . '/controllers/ProductionController.php';
require_once __DIR__ . '/controllers/JobOrdersController.php';
require_once __DIR__ . '/controllers/PersonnelController.php';
require_once __DIR__ . '/controllers/AuditController.php';
require_once __DIR__ . '/controllers/DatabaseController.php';

// Parse Request URI
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$method = $_SERVER['REQUEST_METHOD'];

// Strip base prefix if running in subdirectory
$basePath = '/backend/api';
if (str_starts_with($requestUri, $basePath)) {
    $path = substr($requestUri, strlen($basePath));
} else {
    $path = $requestUri;
}
$path = '/' . trim($path, '/');

// Simple Router
try {
    if ($path === '' || $path === '/' || $path === '/health') {
        Response::success([
            'system' => 'Plate Lifecycle Monitoring System (PLMSys)',
            'backend' => 'PHP ' . PHP_VERSION,
            'status' => 'ONLINE',
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    // Database Status & SQL Export
    if ($path === '/db/status' && $method === 'GET') {
        DatabaseController::status();
    }
    if ($path === '/db/query' && $method === 'POST') {
        DatabaseController::executeQuery();
    }
    if ($path === '/db/export/mysql' && $method === 'GET') {
        DatabaseController::exportSql('mysql');
    }
    if ($path === '/db/export/postgres' && $method === 'GET') {
        DatabaseController::exportSql('postgres');
    }

    // Sets Endpoints
    if ($path === '/sets' && $method === 'GET') {
        SetsController::index();
    }
    if ($path === '/sets' && $method === 'POST') {
        SetsController::create();
    }
    if (preg_match('#^/sets/([^/]+)$#', $path, $matches)) {
        $id = $matches[1];
        if ($method === 'GET') SetsController::show($id);
        if ($method === 'PUT' || $method === 'POST') SetsController::update($id);
        if ($method === 'DELETE') SetsController::delete($id);
    }

    // Positions Endpoints
    if ($path === '/positions' && $method === 'GET') {
        PositionsController::index();
    }
    if (preg_match('#^/positions/([^/]+)$#', $path, $matches) && ($method === 'PUT' || $method === 'POST')) {
        PositionsController::update($matches[1]);
    }

    // Plates & Lifecycle Endpoints
    if ($path === '/plates' && $method === 'GET') {
        PlatesController::index();
    }
    if ($path === '/plates/install' && $method === 'POST') {
        PlatesController::install();
    }
    if ($path === '/plates/remove' && $method === 'POST') {
        PlatesController::remove();
    }

    // Production Endpoints
    if ($path === '/production' && $method === 'GET') {
        ProductionController::index();
    }
    if ($path === '/production' && $method === 'POST') {
        ProductionController::create();
    }

    // Job Orders Endpoints
    if ($path === '/job-orders' && $method === 'GET') {
        JobOrdersController::index();
    }
    if ($path === '/job-orders' && $method === 'POST') {
        JobOrdersController::create();
    }

    // Personnel & Auth Endpoints
    if ($path === '/personnel' && $method === 'GET') {
        PersonnelController::index();
    }
    if ($path === '/auth/login' && $method === 'POST') {
        PersonnelController::authenticate();
    }

    // Audit Logs Endpoints
    if ($path === '/audit-logs' && $method === 'GET') {
        AuditController::index();
    }
    if ($path === '/audit-logs' && $method === 'POST') {
        AuditController::log();
    }

    Response::error("Route not found: {$method} {$path}", 404);
} catch (Throwable $e) {
    Response::error("Unhandled Server Error: " . $e->getMessage(), 500, [
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
