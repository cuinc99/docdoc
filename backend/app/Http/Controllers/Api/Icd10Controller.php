<?php

namespace App\Http\Controllers\Api;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class Icd10Controller extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = mb_strtolower((string) $request->query('search', ''));
        $path = database_path('data/icd10.json');

        /** @var list<array{code: string, description: string}> $data */
        $data = json_decode((string) file_get_contents($path), true);

        if ($search !== '') {
            $data = array_values(array_filter($data, function (array $item) use ($search): bool {
                return str_contains(mb_strtolower($item['code']), $search)
                    || str_contains(mb_strtolower($item['description']), $search);
            }));
        }

        return ApiResponse::success(array_slice($data, 0, 50));
    }
}
