<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('portal_documents', function (Blueprint $table) {
            $table->string('storage_disk')->default('local')->after('disk_path');
        });
    }

    public function down(): void
    {
        Schema::table('portal_documents', function (Blueprint $table) {
            $table->dropColumn('storage_disk');
        });
    }
};
