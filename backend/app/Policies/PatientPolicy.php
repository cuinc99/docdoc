<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'receptionist']);
    }

    public function view(User $user, Patient $patient): bool
    {
        return in_array($user->role, ['admin', 'doctor', 'receptionist']);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'receptionist']);
    }

    public function update(User $user, Patient $patient): bool
    {
        return in_array($user->role, ['admin', 'receptionist']);
    }

    public function delete(User $user, Patient $patient): bool
    {
        return $user->role === 'admin';
    }
}
