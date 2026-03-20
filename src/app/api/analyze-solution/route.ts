import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerSupabase } from '@/lib/supabase-server';
import { analyzeSolution } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createAuthServerSupabase();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { problemId, userSolution } = body;

    if (!problemId || !userSolution?.trim()) {
      return NextResponse.json({ error: 'Missing problemId or userSolution' }, { status: 400 });
    }

    // Fetch problem metadata (NOT content - external link model)
    const { data: problem, error: problemError } = await supabase
      .from('problems')
      .select('id, title, source, year, subject, concepts, difficulty')
      .eq('id', problemId)
      .single();

    if (problemError || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 });
    }

    // Check user subscription tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const isPro = profile?.subscription_tier === 'pro';

    // Check daily usage for free users
    if (!isPro) {
      const today = new Date().toISOString().split('T')[0];
      const { data: usage } = await supabase
        .from('usage_daily')
        .select('ai_analyses_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (usage && usage.ai_analyses_count >= 3) {
        return NextResponse.json(
          { error: 'Daily limit reached. Upgrade to Pro for unlimited analyses.' },
          { status: 429 }
        );
      }
    }

    // Call Gemini API
    const model = isPro ? 'gemini-3-flash-preview' : 'gemini-2.5-flash';
    const result = await analyzeSolution({
      subject: problem.subject || 'physics',
      source: problem.source,
      year: problem.year,
      concepts: problem.concepts || [],
      difficulty: problem.difficulty || 5,
      title: problem.title,
      userSolution: userSolution.trim(),
      isPro,
    });

    // Save analysis to DB
    await supabase.from('ai_analyses').insert({
      user_id: user.id,
      problem_id: problemId,
      user_solution: userSolution.trim(),
      score: result.score,
      feedback: result,
      model,
    });

    // Update daily usage count
    const today = new Date().toISOString().split('T')[0];
    const { data: existingUsage } = await supabase
      .from('usage_daily')
      .select('ai_analyses_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (existingUsage) {
      await supabase
        .from('usage_daily')
        .update({ ai_analyses_count: existingUsage.ai_analyses_count + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('usage_daily')
        .insert({ user_id: user.id, date: today, ai_analyses_count: 1 });
    }

    return NextResponse.json({
      score: result.score,
      feedback: result.feedback,
      strengths: result.strengths,
      weakPoints: result.weakPoints,
      conceptsToReview: result.conceptsToReview,
      nextSteps: result.nextSteps,
      model,
    });
  } catch (error) {
    console.error('[analyze-solution] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
