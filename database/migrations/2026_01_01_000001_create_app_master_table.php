<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_master', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50)->index();
            $table->string('code', 100);
            $table->string('label', 150);
            $table->string('description', 255)->nullable();
            $table->json('value')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['type', 'code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_master');
    }
};
