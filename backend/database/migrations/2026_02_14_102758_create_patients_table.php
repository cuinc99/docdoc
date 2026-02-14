<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('mr_number')->unique();
            $table->string('nik', 16)->unique();
            $table->string('name');
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date');
            $table->string('phone', 20);
            $table->string('email')->nullable();
            $table->text('address');
            $table->enum('blood_type', ['A', 'B', 'AB', 'O'])->nullable();
            $table->text('allergies')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone', 20)->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
