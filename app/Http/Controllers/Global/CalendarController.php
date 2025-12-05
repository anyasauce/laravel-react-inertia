<?php

namespace App\Http\Controllers\Global;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
class CalendarController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('Calendar');
    }
}
