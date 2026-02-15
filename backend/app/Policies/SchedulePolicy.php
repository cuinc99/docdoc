<?php

namespace App\Policies;

use App\Models\Schedule;
use App\Models\User;

class SchedulePolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'receptionist']);
    }

    public function view(User $user, Schedule $schedule): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'receptionist']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor']);
    }

    public function update(User $user, Schedule $schedule): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'doctor' && $user->id === $schedule->doctor_id;
    }

    public function delete(User $user, Schedule $schedule): bool
    {
        if ($user->role === 'admin') {
            return true;
        }

        return $user->role === 'doctor' && $user->id === $schedule->doctor_id;
    }
}
