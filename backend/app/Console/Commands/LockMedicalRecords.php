<?php

namespace App\Console\Commands;

use App\Models\MedicalRecord;
use Illuminate\Console\Command;

class LockMedicalRecords extends Command
{
    protected $signature = 'medical-records:lock';
    protected $description = 'Auto-lock medical records older than 24 hours';

    public function handle(): int
    {
        $count = MedicalRecord::where('is_locked', false)
            ->where('created_at', '<', now()->subHours(24))
            ->update(['is_locked' => true, 'locked_at' => now()]);

        $this->info("Locked {$count} medical record(s).");

        return self::SUCCESS;
    }
}
