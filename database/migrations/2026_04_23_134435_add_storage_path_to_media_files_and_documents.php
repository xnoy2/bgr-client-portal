<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add storage_path to media_files (used for progress update photos)
        Schema::table('media_files', function (Blueprint $table) {
            $table->string('storage_path')->nullable()->after('url');
            $table->string('storage_disk')->nullable()->default('azure')->after('storage_path');
        });

        // Add storage_path to documents (used for admin document uploads)
        Schema::table('documents', function (Blueprint $table) {
            $table->string('storage_path')->nullable()->after('url');
            $table->string('storage_disk')->nullable()->default('azure')->after('storage_path');
        });
    }

    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->dropColumn(['storage_path', 'storage_disk']);
        });

        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['storage_path', 'storage_disk']);
        });
    }
};
