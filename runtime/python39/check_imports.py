import sys, importlib, traceback
print('sys.executable =', sys.executable)
print('Python version =', sys.version)
print('\n--- import checks ---')
libs = ['numpy','pandas','sklearn','matplotlib','seaborn']
for lib in libs:
    try:
        m = importlib.import_module(lib)
        ver = getattr(m, '__version__', repr(type(m)))
        print(f"{lib}: OK — {ver}")
    except Exception as e:
        print(f"{lib}: ERROR — {type(e).__name__}: {e}")
        traceback.print_exc()
