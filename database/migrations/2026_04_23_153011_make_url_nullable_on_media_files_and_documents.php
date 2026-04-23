<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // url is no longer required — R2 uploads use storage_path instead
        Schema::table('media_files', function (Blueprint $table) {
            $table->string('url')->nullable()->change();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->string('url')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->string('url')->nullable(false)->change();
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->string('url')->nullable(false)->change();
        });
    }
};
