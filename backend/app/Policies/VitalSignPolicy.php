<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VitalSign;

class VitalSignPolicy
{
    public function viewAny(User $user): bool { return in_array($user->role, ['admin', 'doctor', 'receptionist']); }
    public function view(User $user, VitalSign $vitalSign): bool { return in_array($user->role, ['admin', 'doctor', 'receptionist']); }
    public function create(User $user): bool { return in_array($user->role, ['admin', 'receptionist']); }
    public function update(User $user, VitalSign $vitalSign): bool { return in_array($user->role, ['admin', 'receptionist']); }
    public function delete(User $user, VitalSign $vitalSign): bool { return in_array($user->role, ['admin', 'receptionist']); }
}
