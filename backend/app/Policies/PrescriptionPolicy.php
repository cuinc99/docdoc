<?php

namespace App\Policies;

use App\Models\Prescription;
use App\Models\User;

class PrescriptionPolicy
{
    public function viewAny(User $user): bool { return true; }
    public function view(User $user, Prescription $prescription): bool { return true; }
    public function create(User $user): bool { return in_array($user->role, ['admin', 'doctor']); }

    public function update(User $user, Prescription $prescription): bool
    {
        return in_array($user->role, ['admin', 'doctor']) && $prescription->isEditable();
    }

    public function delete(User $user, Prescription $prescription): bool
    {
        return in_array($user->role, ['admin', 'doctor']) && $prescription->isEditable();
    }

    public function dispense(User $user, Prescription $prescription): bool
    {
        return in_array($user->role, ['admin', 'receptionist']) && !$prescription->is_dispensed;
    }
}
