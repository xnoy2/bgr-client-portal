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
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->json('photos')->nullable()->after('site_location');
        });
    }

    public function down(): void
    {
        Schema::table('variation_requests', function (Blueprint $table) {
            $table->dropColumn('photos');
        });
    }
};
